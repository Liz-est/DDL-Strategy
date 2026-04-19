import type { AcademicEvent, CourseMilestone, CoursePlan } from '@/store/academic-planner'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
type JsonObject = Record<string, JsonValue>

interface ParsedPayload {
	rows: NormalizedTaskRow[]
	taskList: JsonObject[]
	courseCode: string
	courseName: string
	gradingPolicy: JsonObject | null
	advice: string | null
	courseSummaryJson: JsonObject[] | null
	parsed: JsonObject | JsonObject[]
}

interface AcademicSnapshotItem {
	rawData: string | JsonObject | JsonObject[]
	courseCode: string | null
}

interface NormalizedTaskRow {
	courseCode: string
	courseName: string
	task: JsonObject
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

const toObject = (value: JsonValue | undefined): JsonObject | null => {
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		return value
	}
	return null
}

const parseWeightValue = (value: JsonValue | undefined) => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : 0
	if (typeof value === 'string') {
		const cleaned = value.replace(/%/g, '').trim()
		const parsed = Number.parseFloat(cleaned)
		return Number.isFinite(parsed) ? parsed : 0
	}
	return 0
}

const parseCourseArray = (value: JsonValue | undefined): JsonObject[] => {
	if (Array.isArray(value)) {
		return value.filter((item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item))
	}
	if (typeof value === 'string') {
		const parsed = parseLooseJson(value)
		if (Array.isArray(parsed)) {
			return parsed.filter((item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item))
		}
		if (parsed && Array.isArray(parsed.courses)) {
			return parsed.courses.filter(
				(item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
			)
		}
	}
	return []
}

const parseAdvice = (payload: JsonObject) => {
	return typeof payload.advice === 'string' && payload.advice.trim() ? payload.advice : null
}

export const normalizeAcademicPayload = (parsed: JsonObject | JsonObject[]): ParsedPayload | null => {
	const rootPayload: JsonObject = Array.isArray(parsed) ? { assessments: parsed } : parsed
	const rows: NormalizedTaskRow[] = []

	const directAssessments = Array.isArray(rootPayload.assessments)
		? rootPayload.assessments.filter(
				(item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
		  )
		: []

	if (directAssessments.length > 0) {
		const rootCourseInfo = toObject(rootPayload.course_info) ?? {}
		const courseName =
			typeof rootCourseInfo.course_name === 'string'
				? rootCourseInfo.course_name
				: typeof rootCourseInfo.course_code === 'string'
					? rootCourseInfo.course_code
					: DEFAULT_COURSE
		const courseCode =
			typeof rootCourseInfo.course_code === 'string'
				? rootCourseInfo.course_code
				: typeof rootCourseInfo.course_name === 'string'
					? rootCourseInfo.course_name
					: DEFAULT_COURSE
		directAssessments.forEach(task => {
			rows.push({ task, courseCode, courseName })
		})
	}

	const normalizedCourses = parseCourseArray(rootPayload.courses)
	if (normalizedCourses.length > 0) {
		normalizedCourses.forEach(courseItem => {
			const courseInfo = toObject(courseItem.course_info) ?? {}
			const courseName =
				typeof courseInfo.course_name === 'string'
					? courseInfo.course_name
					: typeof courseInfo.name === 'string'
						? courseInfo.name
						: typeof courseInfo.course_code === 'string'
							? courseInfo.course_code
							: DEFAULT_COURSE
			const courseCode =
				typeof courseInfo.course_code === 'string'
					? courseInfo.course_code
					: typeof courseInfo.course_name === 'string'
						? courseInfo.course_name
						: typeof courseInfo.name === 'string'
							? courseInfo.name
							: DEFAULT_COURSE
			const deadlines = Array.isArray(courseItem.deadlines)
				? courseItem.deadlines.filter(
						(item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
				  )
				: []
			const legacyAssessments = Array.isArray(courseItem.assessments)
				? courseItem.assessments.filter(
						(item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
				  )
				: []
			const taskList = deadlines.length > 0 ? deadlines : legacyAssessments
			taskList.forEach(task => {
				rows.push({ task, courseCode, courseName })
			})
		})
	}

	if (rows.length === 0) return null

	const firstRow = rows[0]
	const gradingPolicy =
		toObject(rootPayload.grading_policy) ??
		toObject(normalizedCourses[0]?.grading_policy) ??
		toObject(toObject(normalizedCourses[0]?.course_info)?.grading_policy) ??
		null

	return {
		rows,
		taskList: rows.map(item => item.task),
		courseCode: firstRow.courseCode,
		courseName: firstRow.courseName,
		gradingPolicy,
		advice: parseAdvice(rootPayload),
		courseSummaryJson: normalizedCourses.length > 0 ? normalizedCourses : null,
		parsed,
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

	const jsonRegex =
		/(\{[\s\S]*?("courses"|"assessments"|"deadlines"|"due_date_raw"|"due_date")[\s\S]*?\}|\[[\s\S]*?("due_date_raw"|"due_date")[\s\S]*?\])/
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
	return normalizeAcademicPayload(parsed)
}

export const mapTaskToEvent = (
	task: JsonObject,
	courseCode: string,
	index: number,
	courseName?: string
): AcademicEvent => {
	const title =
		typeof task.name === 'string' ? task.name : typeof task.title === 'string' ? task.title : `Task ${index + 1}`
	const dueDate =
		typeof task.due_date_raw === 'string'
			? task.due_date_raw
			: typeof task.due_date === 'string'
				? task.due_date
				: new Date().toISOString().split('T')[0]
	const weight = parseWeightValue(task.weight)
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
			courseName,
			detail: typeof task.description === 'string' ? task.description : null,
			sourceQuote: typeof task.source_quote === 'string' ? task.source_quote : null,
			pageNumbers: Array.isArray(task.page_numbers) ? task.page_numbers : [],
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
	adviceText?: string | null
	courseSummaryJson?: JsonObject[] | null
	description?: string
}) => {
	const { apiBase, userId, courseCode, jsonData, adviceText, courseSummaryJson, description } = params
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
				adviceText: adviceText || null,
				courseSummaryJson: courseSummaryJson || null,
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
		detail:
			typeof event.extendedProps?.detail === 'string'
				? event.extendedProps.detail
				: typeof event.extendedProps?.description === 'string'
					? event.extendedProps.description
					: null,
		sourceQuote: typeof event.extendedProps?.sourceQuote === 'string' ? event.extendedProps.sourceQuote : null,
		pageNumbers: Array.isArray(event.extendedProps?.pageNumbers) ? event.extendedProps.pageNumbers : [],
		estimatedHours:
			typeof event.extendedProps?.estimated_hours === 'number'
				? event.extendedProps.estimated_hours
				: typeof event.extendedProps?.estimatedHours === 'number'
					? event.extendedProps.estimatedHours
					: null,
		rationale: typeof event.extendedProps?.rationale === 'string' ? event.extendedProps.rationale : null,
		courseName: typeof event.extendedProps?.courseName === 'string' ? event.extendedProps.courseName : null,
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
	const events = records.flatMap(item => {
		const parsed =
			typeof item.rawData === 'string' ? parseLooseJson(item.rawData) : Array.isArray(item.rawData) || item.rawData ? item.rawData : null
		if (!parsed) return []
		const normalized = normalizeAcademicPayload(parsed)
		if (!normalized) return []
		return normalized.rows.map((row, index) => mapTaskToEvent(row.task, row.courseCode, index, row.courseName))
	})

	return {
		events,
		courses: buildCoursePlans(events),
	}
}
