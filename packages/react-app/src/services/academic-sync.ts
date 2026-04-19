import type { AcademicEvent, CourseMilestone, CoursePlan } from '@/store/academic-planner'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
type JsonObject = Record<string, JsonValue>

interface ParsedPayload {
	taskList: JsonObject[]
	courseCode: string
	courseName: string
	gradingPolicy: JsonObject | null
	parsed: JsonObject | JsonObject[]
}

interface AcademicSnapshotItem {
	rawData: string | JsonObject | JsonObject[]
	courseCode: string | null
}

const DEFAULT_COURSE = 'UNKNOWN'

const isEscaped = (text: string, pos: number) => {
	let index = pos - 1
	let count = 0
	while (index >= 0 && text[index] === '\\') {
		count++
		index--
	}
	return count % 2 === 1
}

const extractBalanced = (text: string, start: number) => {
	const open = text[start]
	const pairMap: Record<string, string> = { '[': ']', '{': '}' }
	const close = pairMap[open]
	if (!close) return null

	const stack = [open]
	let inString = false
	let quote: '"' | "'" | null = null

	for (let i = start + 1; i < text.length; i++) {
		const current = text[i]
		if ((current === '"' || current === "'") && !isEscaped(text, i)) {
			if (!inString) {
				inString = true
				quote = current
			} else if (quote === current) {
				inString = false
				quote = null
			}
			continue
		}
		if (inString) continue

		if (current === '{' || current === '[') {
			stack.push(current)
			continue
		}
		if (current === '}' || current === ']') {
			const last = stack[stack.length - 1]
			if ((last === '{' && current === '}') || (last === '[' && current === ']')) {
				stack.pop()
			} else {
				return null
			}
			if (stack.length === 0) {
				return text.slice(start, i + 1)
			}
		}
	}
	return null
}

const parseLooseJson = (rawText: string): JsonObject | JsonObject[] | null => {
	const cleaned = rawText.replace(/```json|```/g, '').trim()
	if (!cleaned) return null

	try {
		return JSON.parse(cleaned)
	} catch {
		const noTrailingComma = cleaned.replace(/,\s*(?=[}\]])/g, '')
		try {
			return JSON.parse(noTrailingComma)
		} catch {
			return null
		}
	}
}

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(url, init)
	if (!response.ok) {
		const errorText = await response.text()
		throw new Error(errorText || `Request failed: ${response.status}`)
	}
	return response.json() as Promise<T>
}

const withRetry = async <T>(runner: () => Promise<T>, retries = 2): Promise<T> => {
	let latestError: unknown
	for (let i = 0; i <= retries; i++) {
		try {
			return await runner()
		} catch (error) {
			latestError = error
			if (i < retries) {
				await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)))
			}
		}
	}
	throw latestError instanceof Error ? latestError : new Error('Unknown request error')
}

export const createApiUrl = (apiBase: string, path: string) => {
	const normalizedBase = (apiBase || '').replace(/\/$/, '')
	return normalizedBase ? `${normalizedBase}${path}` : `/api/client${path}`
}

export const extractAcademicPayloadFromText = (text: string): ParsedPayload | null => {
	if (!text) return null

	const jsonRegex = /(\[[\s\S]*?due_date_raw[\s\S]*?\]|\{[\s\S]*?assessments[\s\S]*?\})/
	const result = jsonRegex.exec(text)
	if (!result) return null

	const start = result.index ?? 0
	const arrayPos = text.indexOf('[', start)
	const objectPos = text.indexOf('{', start)
	const startPos =
		arrayPos !== -1 && objectPos !== -1 ? Math.min(arrayPos, objectPos) : Math.max(arrayPos, objectPos)
	const rawCandidate = startPos >= 0 ? extractBalanced(text, startPos) : result[0]
	const parsed = parseLooseJson(rawCandidate ?? result[0])
	if (!parsed) return null

	const payload: JsonObject = Array.isArray(parsed) ? { assessments: parsed } : parsed
	const taskList = Array.isArray(payload.assessments) ? payload.assessments : []
	if (taskList.length === 0) return null

	const courseInfo = payload.course_info
	const safeCourseInfo = typeof courseInfo === 'object' && courseInfo && !Array.isArray(courseInfo) ? courseInfo : {}
	const courseName =
		typeof safeCourseInfo.course_name === 'string'
			? safeCourseInfo.course_name
			: typeof safeCourseInfo.course_code === 'string'
				? safeCourseInfo.course_code
				: DEFAULT_COURSE
	const courseCode =
		typeof safeCourseInfo.course_code === 'string' ? safeCourseInfo.course_code : courseName || DEFAULT_COURSE

	return {
		taskList: taskList.filter((item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)),
		courseCode,
		courseName,
		gradingPolicy:
			typeof payload.grading_policy === 'object' &&
			payload.grading_policy !== null &&
			!Array.isArray(payload.grading_policy)
				? payload.grading_policy
				: null,
		parsed,
	}
}

export const mapTaskToEvent = (
	task: JsonObject,
	courseCode: string,
	index: number
): AcademicEvent => {
	const title =
		typeof task.name === 'string' ? task.name : typeof task.title === 'string' ? task.title : `Task ${index + 1}`
	const dueDate = typeof task.due_date_raw === 'string' ? task.due_date_raw : new Date().toISOString().split('T')[0]
	const weight = Number(task.weight) || 0
	const type =
		typeof task.task_type_standardized === 'string'
			? task.task_type_standardized
			: typeof task.type === 'string'
				? task.type
				: 'Task'
	const highRisk = weight >= 30 || type === 'Exam'

	return {
		id: `ai-${courseCode}-${title}-${index}`.replace(/\s+/g, '-'),
		title,
		start: dueDate,
		end: typeof task.end_date === 'string' ? task.end_date : undefined,
		allDay: true,
		color: highRisk ? '#ef4444' : '#10b981',
		weight,
		type,
		courseCode,
		priority: highRisk ? 'high' : 'medium',
		extendedProps: {
			source: 'ai',
			estimated_hours: task.estimated_hours,
			rationale: task.rationale,
		},
	}
}

export const mergeUniqueEvents = (current: AcademicEvent[], incoming: AcademicEvent[]) => {
	const keys = new Set(current.map(item => `${item.title}::${item.start}::${item.courseCode ?? ''}`))
	const unique = incoming.filter(item => {
		const key = `${item.title}::${item.start}::${item.courseCode ?? ''}`
		if (keys.has(key)) return false
		keys.add(key)
		return true
	})
	return [...current, ...unique]
}

export const buildCoursePlans = (events: AcademicEvent[]): CoursePlan[] => {
	const grouped = events.reduce<Record<string, AcademicEvent[]>>((acc, event) => {
		const code = event.courseCode || DEFAULT_COURSE
		acc[code] = acc[code] || []
		acc[code].push(event)
		return acc
	}, {})

	return Object.entries(grouped).map(([courseCode, courseEvents]) => {
		const milestones: CourseMilestone[] = courseEvents
			.filter(item => item.type || item.weight)
			.map(item => ({
				id: item.id,
				title: item.title,
				dueDate: item.start,
				weight: item.weight || 0,
				type: item.type || 'Task',
			}))
		const completedWeight = milestones.reduce((acc, item) => acc + item.weight, 0)
		const completionRate = Math.min(100, Math.round((completedWeight / 100) * 100))

		return {
			id: `course-${courseCode}`,
			courseCode,
			courseName: courseCode,
			completionRate,
			milestones,
		}
	})
}

export const saveJsonToDatabase = async (params: {
	apiBase: string
	userId: string
	courseCode: string
	jsonData: JsonObject | JsonObject[]
	description?: string
}) => {
	const { apiBase, userId, courseCode, jsonData, description } = params
	const url = createApiUrl(apiBase, '/document/save')
	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				courseCode: courseCode || null,
				jsonData,
				sourceType: 'academic',
				description: description || 'Academic tasks processing result',
			}),
		})
	)
}

export const saveCoursePolicies = async (params: {
	apiBase: string
	userId: string
	courseCode: string
	gradingPolicy: JsonObject
}) => {
	const { apiBase, userId, courseCode, gradingPolicy } = params
	if (!gradingPolicy || !courseCode || courseCode === DEFAULT_COURSE) return null

	const url = createApiUrl(apiBase, '/policies/save')
	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				courseCode,
				late_policy: gradingPolicy.late_policy || null,
				absence_policy: gradingPolicy.absence_policy || null,
				grading_notes: gradingPolicy.grading_notes || null,
			}),
		})
	)
}

export const syncAcademicTasks = async (params: {
	apiBase: string
	userId: string
	courseCode: string
	events: AcademicEvent[]
}) => {
	const { apiBase, userId, courseCode, events } = params
	const url = createApiUrl(apiBase, '/academic/sync')
	const tasks = events.map(event => ({
		id: event.id,
		title: event.title,
		dueDate: event.start,
		weight: event.weight || 0,
		type: event.type || 'Task',
	}))

	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				courseCode: courseCode || DEFAULT_COURSE,
				tasks,
			}),
		})
	)
}

export const loadAcademicSnapshots = async (params: { apiBase: string; userId: string }) => {
	const url = createApiUrl(params.apiBase, `/document/save?userId=${encodeURIComponent(params.userId)}`)
	const response = await requestJson<{ data?: AcademicSnapshotItem[] }>(url)
	const records = Array.isArray(response.data) ? response.data : []
	const parsedPayloads = records
		.map(item => (typeof item.rawData === 'string' ? parseLooseJson(item.rawData) : item.rawData))
		.filter((item): item is JsonObject | JsonObject[] => Boolean(item))

	const events = parsedPayloads.flatMap(item => {
		const payload: JsonObject = Array.isArray(item) ? { assessments: item } : item
		const courseInfo = payload.course_info
		const safeCourseInfo = typeof courseInfo === 'object' && courseInfo && !Array.isArray(courseInfo) ? courseInfo : {}
		const courseCode =
			typeof safeCourseInfo.course_code === 'string'
				? safeCourseInfo.course_code
				: typeof safeCourseInfo.course_name === 'string'
					? safeCourseInfo.course_name
					: DEFAULT_COURSE
		const taskList = Array.isArray(payload.assessments) ? payload.assessments : []
		return taskList
			.filter((task): task is JsonObject => typeof task === 'object' && task !== null && !Array.isArray(task))
			.map((task, index) => mapTaskToEvent(task, courseCode, index))
	})

	return {
		events,
		courses: buildCoursePlans(events),
	}
}
