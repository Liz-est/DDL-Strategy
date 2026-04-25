import type {
	AcademicEvent,
	CourseDetail,
	CourseMilestone,
	CoursePlan,
	CoursePolicyProfile,
	CoursePolicyRule,
	IngestionSnapshotItem,
} from '@/store/academic-planner'

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

export interface AcademicPayloadExtractionResult {
	payload: ParsedPayload | null
	errorCode:
		| 'EMPTY_TEXT'
		| 'NO_JSON_BLOCK'
		| 'JSON_PARSE_FAILED'
		| 'INVALID_ACADEMIC_SHAPE'
		| 'NORMALIZATION_FAILED'
		| null
	errorMessage: string | null
	source: 'anchors' | 'hints' | null
}

interface AcademicSnapshotItem {
	rawData: string | JsonObject | JsonObject[]
	courseCode: string | null
}

interface OverviewCourseItem {
	course_code: string
	name?: string | null
	course_name?: string | null
	description?: string | null
	source_quote?: string | null
	manual_completion_rate?: number | null
	manual_semester_progress?: number | null
}

interface OverviewPolicyItem {
	id: string
	course_code: string
	raw_policy_text?: string | null
	late_policy?: string | null
	absence_policy?: string | null
	grading_notes?: string | null
	extension_rule?: string | null
	integrity_rule?: string | null
	collaboration_rule?: string | null
	exam_aid_rule?: string | null
}

interface OverviewPolicyRuleItem {
	id: string
	policy_id: string
	rule_type: string
	threshold_value?: number | null
	penalty_percent?: number | null
	time_unit?: string | null
	raw_quote?: string | null
	rule_order?: number | null
}

interface OverviewTaskItem {
	id: string
	title: string
	course_code?: string | null
	course_name?: string | null
	type?: string | null
	weight?: number | null
	start_at?: string | null
	end_at?: string | null
	is_all_day?: boolean | null
	due_date?: string | null
	detail?: string | null
	source_quote?: string | null
	page_numbers_json?: string | null
	estimated_hours?: number | null
	rationale?: string | null
}

interface OverviewChoreItem {
	id: string
	title: string
	start_at?: string | Date | null
	end_at?: string | Date | null
	is_all_day?: boolean | number | null
	priority?: string | null
	location?: string | null
	detail?: string | null
}

interface OverviewSnapshotItem {
	id: string
	course_code?: string | null
	source_type?: string | null
	report_text?: string | null
	created_at?: string
}

interface NormalizedTaskRow {
	courseCode: string
	courseName: string
	task: JsonObject
}

export const DEFAULT_COURSE = 'UNKNOWN'

const parseJsonSafe = (raw: string): unknown[] | null => {
	try {
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? parsed : null
	} catch {
		return null
	}
}

const toIsoLikeString = (value: unknown): string | undefined => {
	if (value == null) return undefined
	if (value instanceof Date) return value.toISOString()
	if (typeof value === 'string') return value
	return undefined
}

export const mapChoreRowToEvent = (row: OverviewChoreItem): AcademicEvent => {
	const allDay = row.is_all_day === true || row.is_all_day === 1
	const startRaw = toIsoLikeString(row.start_at)
	const start =
		startRaw ||
		(() => {
			const d = new Date()
			return allDay ? d.toISOString().slice(0, 10) : d.toISOString()
		})()
	const endRaw = toIsoLikeString(row.end_at)
	const priority =
		row.priority === 'low' || row.priority === 'medium' || row.priority === 'high' ? row.priority : 'medium'
	return {
		id: row.id,
		title: row.title,
		start,
		end: endRaw,
		allDay,
		taskCategory: 'chores',
		type: 'Chore',
		color: '#bbf7d0',
		priority,
		extendedProps: {
			taskCategory: 'chores',
			location: row.location ?? undefined,
			detail: row.detail ?? undefined,
		},
	}
}

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

const extractBalancedLoose = (text: string, start: number) => {
	const open = text[start]
	const pairMap: Record<string, string> = { '[': ']', '{': '}' }
	const close = pairMap[open]
	if (!close) return null
	let depth = 1
	for (let i = start + 1; i < text.length; i++) {
		const current = text[i]
		if (current === open) depth++
		if (current === close) depth--
		if (depth === 0) {
			return text.slice(start, i + 1)
		}
	}
	return null
}

const repairUnescapedQuotes = (text: string) => {
	let output = ''
	let inString = false
	let escaped = false
	for (let i = 0; i < text.length; i++) {
		const current = text[i]
		if (!inString) {
			if (current === '"') inString = true
			output += current
			continue
		}
		if (escaped) {
			output += current
			escaped = false
			continue
		}
		if (current === '\\') {
			output += current
			escaped = true
			continue
		}
		if (current === '"') {
			let j = i + 1
			while (j < text.length && /\s/.test(text[j])) j++
			const next = text[j] || ''
			// For valid JSON strings, a closing quote is followed by , } ] or :.
			// Anything else is likely an unescaped inner quote from LLM output.
			if (next && ![',', '}', ']', ':'].includes(next)) {
				output += '\\"'
				continue
			}
			inString = false
			output += current
			continue
		}
		output += current
	}
	return output
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
			const repairedQuotes = repairUnescapedQuotes(noTrailingComma)
			try {
				return JSON.parse(repairedQuotes)
			} catch {
				return null
			}
		}
	}
}

const validateAcademicShape = (parsed: JsonObject | JsonObject[]) => {
	const payload = Array.isArray(parsed) ? ({ assessments: parsed } as JsonObject) : parsed
	const hasCourses = Object.prototype.hasOwnProperty.call(payload, 'courses')
	const hasAssessments = Object.prototype.hasOwnProperty.call(payload, 'assessments')
	if (!hasCourses && !hasAssessments) {
		return {
			ok: false,
			reason: 'Payload missing both `courses` and `assessments`.',
		}
	}
	if (hasCourses && !Array.isArray(payload.courses)) {
		return {
			ok: false,
			reason: '`courses` must be an array when present.',
		}
	}
	if (Array.isArray(payload.courses)) {
		const invalidIndex = payload.courses.findIndex(
			(item: JsonValue) => !(typeof item === 'object' && item !== null && !Array.isArray(item))
		)
		if (invalidIndex >= 0) {
			return {
				ok: false,
				reason: `courses[${invalidIndex}] must be an object.`,
			}
		}
	}
	if (hasAssessments && !Array.isArray(payload.assessments)) {
		return {
			ok: false,
			reason: '`assessments` must be an array when present.',
		}
	}
	return { ok: true, reason: null }
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
		return value.filter(
			(item: JsonValue): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
		)
	}
	if (typeof value === 'string') {
		const parsed = parseLooseJson(value)
		if (Array.isArray(parsed)) {
			return parsed.filter(
				(item: JsonValue): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
			)
		}
		if (parsed && Array.isArray(parsed.courses)) {
			return parsed.courses.filter(
				(item: JsonValue): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
			)
		}
	}
	return []
}

const parseAdvice = (payload: JsonObject) => {
	return typeof payload.advice === 'string' && payload.advice.trim() ? payload.advice : null
}

const pickFirstText = (...values: JsonValue[]) => {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) return value.trim()
	}
	return null
}

export const parseGradingPolicyText = (rawPolicy: JsonValue | undefined) => {
	const policyText =
		typeof rawPolicy === 'string'
			? rawPolicy
			: rawPolicy && typeof rawPolicy === 'object'
				? JSON.stringify(rawPolicy)
				: ''
	const text = policyText.replace(/\s+/g, ' ').trim()
	if (!text) {
		return {
			rawPolicyText: null,
			latePolicy: null,
			absencePolicy: null,
			gradingNotes: null,
			extensionRule: null,
			integrityRule: null,
			collaborationRule: null,
			examAidRule: null,
			rules: [] as CoursePolicyRule[],
			parsedPolicyJson: null as string | null,
		}
	}

	const segments = text.split(/(?<=[.;])\s+/).filter(Boolean)
	const rules: CoursePolicyRule[] = []
	let extensionRule: string | null = null
	let integrityRule: string | null = null
	let collaborationRule: string | null = null
	let examAidRule: string | null = null
	let absencePolicy: string | null = null

	segments.forEach((segment, index) => {
		const lateRange = segment.match(/(\d+)\s*[-–]\s*(\d+)\s*hours?.*?(\d+)\s*%/i)
		const lateUnder = segment.match(/up to\s*(\d+)\s*hours?.*?(\d+)\s*%/i)
		const lateOver = segment.match(/more than\s*(\d+)\s*hours?.*?(?:not accepted|0|zero|score\s*=\s*0)/i)
		if (lateRange) {
			rules.push({
				id: `rule-${index}`,
				ruleType: 'late_penalty',
				thresholdValue: Number.parseFloat(lateRange[2]),
				penaltyPercent: Number.parseFloat(lateRange[3]),
				timeUnit: 'hour',
				rawQuote: segment,
				ruleOrder: index,
			})
		} else if (lateUnder) {
			rules.push({
				id: `rule-${index}`,
				ruleType: 'late_penalty',
				thresholdValue: Number.parseFloat(lateUnder[1]),
				penaltyPercent: Number.parseFloat(lateUnder[2]),
				timeUnit: 'hour',
				rawQuote: segment,
				ruleOrder: index,
			})
		} else if (lateOver) {
			rules.push({
				id: `rule-${index}`,
				ruleType: 'late_penalty',
				thresholdValue: Number.parseFloat(lateOver[1]),
				penaltyPercent: 100,
				timeUnit: 'hour',
				rawQuote: segment,
				ruleOrder: index,
			})
		}
		if (!extensionRule && /(extension|accommodation|emergenc)/i.test(segment)) extensionRule = segment
		if (!integrityRule && /(integrity|demerit|disciplinary|zero)/i.test(segment)) integrityRule = segment
		if (!collaborationRule && /(collaboration|group|copying|communicat)/i.test(segment)) collaborationRule = segment
		if (!examAidRule && /(cheat sheet|a4|double-sided|exam)/i.test(segment)) examAidRule = segment
		if (!absencePolicy && /(absence|attendance)/i.test(segment)) absencePolicy = segment
	})

	const parsedPolicy = {
		rawText: text,
		rules,
		extensionRule,
		integrityRule,
		collaborationRule,
		examAidRule,
	}
	return {
		rawPolicyText: text,
		latePolicy: rules.length > 0 ? JSON.stringify(rules) : null,
		absencePolicy,
		gradingNotes: text,
		extensionRule,
		integrityRule,
		collaborationRule,
		examAidRule,
		rules,
		parsedPolicyJson: JSON.stringify(parsedPolicy),
	}
}

export const normalizeAcademicPayload = (parsed: JsonObject | JsonObject[]): ParsedPayload | null => {
	const rootPayload: JsonObject = Array.isArray(parsed) ? { assessments: parsed } : parsed
	const rows: NormalizedTaskRow[] = []

	const directAssessments = Array.isArray(rootPayload.assessments)
		? rootPayload.assessments.filter(
				(item: JsonValue): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
		  )
		: []

	if (directAssessments.length > 0) {
		const rootCourseInfo = toObject(rootPayload.course_info) ?? {}
		const courseName = pickFirstText(rootCourseInfo.course_name, rootCourseInfo.name, rootCourseInfo.course_code) || DEFAULT_COURSE
		const courseCode = pickFirstText(rootCourseInfo.course_code, rootCourseInfo.course_name, rootCourseInfo.name) || DEFAULT_COURSE
		directAssessments.forEach((task: JsonObject) => {
			rows.push({ task, courseCode, courseName })
		})
	}

	const normalizedCourses = parseCourseArray(rootPayload.courses)
	if (normalizedCourses.length > 0) {
		normalizedCourses.forEach(courseItem => {
			const courseInfo = toObject(courseItem.course_info) ?? {}
			const courseName = pickFirstText(courseInfo.course_name, courseInfo.name, courseInfo.course_code) || DEFAULT_COURSE
			const courseCode = pickFirstText(courseInfo.course_code, courseInfo.course_name, courseInfo.name) || DEFAULT_COURSE
			const deadlines = Array.isArray(courseItem.deadlines)
				? courseItem.deadlines.filter(
						(item: JsonValue): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
				  )
				: []
			const legacyAssessments = Array.isArray(courseItem.assessments)
				? courseItem.assessments.filter(
						(item: JsonValue): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item)
				  )
				: []
			const taskList = deadlines.length > 0 ? deadlines : legacyAssessments
			taskList.forEach((task: JsonObject) => {
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

/** Avoid generic `"due_date":` — it appears often in large DOM `innerText` and is slow/noisy. */
const JSON_KEY_ANCHORS = ['"courses":', '"assessments":', '"deadlines":', '"due_date_raw":'] as const

/**
 * Scan for academic JSON inside noisy text (e.g. whole `document.body.innerText`).
 * Tries each anchor and each `{` before it, keeps the longest balanced block that normalizes.
 */
const extractPayloadFromAnchors = (text: string): { normalized: ParsedPayload; jsonStart: number; rawJson: string } | null => {
	let best: { normalized: ParsedPayload; jsonStart: number; rawJson: string } | null = null

	for (const anchor of JSON_KEY_ANCHORS) {
		let from = 0
		while (true) {
			const p = text.indexOf(anchor, from)
			if (p === -1) break
			for (let j = p; j >= 0; j--) {
				if (text[j] !== '{') continue
				const rawJson = extractBalanced(text, j) ?? extractBalancedLoose(text, j)
				if (!rawJson) continue
				const parsed = parseLooseJson(rawJson)
				if (!parsed) continue
				const normalized = normalizeAcademicPayload(parsed)
				if (!normalized || normalized.rows.length === 0) continue
				if (!best || rawJson.length > best.rawJson.length) {
					best = { normalized, jsonStart: j, rawJson }
				}
			}
			from = p + 1
		}
	}

	return best
}

const extractPayloadFromHints = (text: string): { normalized: ParsedPayload; jsonStart: number; rawJson: string } | null => {
	const hints = ['"courses"', 'courses', '"assessments"', 'assessments', '"deadlines"', 'deadlines'] as const
	let best: { normalized: ParsedPayload; jsonStart: number; rawJson: string } | null = null

	for (const hint of hints) {
		let from = 0
		while (true) {
			const p = text.indexOf(hint, from)
			if (p === -1) break
			for (let j = p; j >= 0; j--) {
				if (text[j] !== '{') continue
				const rawJson = extractBalanced(text, j) ?? extractBalancedLoose(text, j)
				if (!rawJson) continue
				const parsed = parseLooseJson(rawJson)
				if (!parsed) continue
				const shape = validateAcademicShape(parsed)
				if (!shape.ok) continue
				const normalized = normalizeAcademicPayload(parsed)
				if (!normalized || normalized.rows.length === 0) continue
				if (!best || rawJson.length > best.rawJson.length) {
					best = { normalized, jsonStart: j, rawJson }
				}
			}
			from = p + hint.length
		}
	}

	return best
}

export const extractAcademicPayloadFromTextResult = (text: string): AcademicPayloadExtractionResult => {
	if (!text) {
		return {
			payload: null,
			errorCode: 'EMPTY_TEXT',
			errorMessage: 'Input text is empty.',
			source: null,
		}
	}

	const fromAnchors = extractPayloadFromAnchors(text)
	if (fromAnchors) {
		let advice = fromAnchors.normalized.advice
		if (!advice) {
			const tail = text.slice(fromAnchors.jsonStart + fromAnchors.rawJson.length).trim()
			if (tail.length > 40) advice = tail
		}
		const payload = advice !== fromAnchors.normalized.advice ? { ...fromAnchors.normalized, advice } : fromAnchors.normalized
		return {
			payload,
			errorCode: null,
			errorMessage: null,
			source: 'anchors',
		}
	}

	const fromHints = extractPayloadFromHints(text)
	if (fromHints) {
		let advice = fromHints.normalized.advice
		if (!advice) {
			const tail = text.slice(fromHints.jsonStart + fromHints.rawJson.length).trim()
			if (tail.length > 40) advice = tail
		}
		const payload = advice !== fromHints.normalized.advice ? { ...fromHints.normalized, advice } : fromHints.normalized
		return {
			payload,
			errorCode: null,
			errorMessage: null,
			source: 'hints',
		}
	}

	const coarseHint = /("courses"|"assessments"|"deadlines"|courses|assessments|deadlines)/.test(text)
	if (!coarseHint) {
		return {
			payload: null,
			errorCode: 'NO_JSON_BLOCK',
			errorMessage: 'No academic JSON block found in text.',
			source: null,
		}
	}

	const firstBrace = text.indexOf('{')
	if (firstBrace === -1) {
		return {
			payload: null,
			errorCode: 'NO_JSON_BLOCK',
			errorMessage: 'Academic keywords found but no JSON object start found.',
			source: null,
		}
	}
	const rawCandidate = extractBalanced(text, firstBrace) ?? extractBalancedLoose(text, firstBrace)
	if (!rawCandidate) {
		return {
			payload: null,
			errorCode: 'NO_JSON_BLOCK',
			errorMessage: 'JSON object appears incomplete (unbalanced braces).',
			source: null,
		}
	}
	const parsed = parseLooseJson(rawCandidate)
	if (!parsed) {
		return {
			payload: null,
			errorCode: 'JSON_PARSE_FAILED',
			errorMessage: 'Failed to parse candidate JSON. Check quote escaping/newlines in string values.',
			source: null,
		}
	}
	const shape = validateAcademicShape(parsed)
	if (!shape.ok) {
		return {
			payload: null,
			errorCode: 'INVALID_ACADEMIC_SHAPE',
			errorMessage: shape.reason,
			source: null,
		}
	}
	const normalized = normalizeAcademicPayload(parsed)
	if (!normalized) {
		return {
			payload: null,
			errorCode: 'NORMALIZATION_FAILED',
			errorMessage: 'Academic payload parsed but no valid rows could be normalized.',
			source: null,
		}
	}
	return {
		payload: normalized,
		errorCode: null,
		errorMessage: null,
		source: null,
	}
}

export const extractAcademicPayloadFromText = (text: string): ParsedPayload | null => {
	const result = extractAcademicPayloadFromTextResult(text)
	if (!result.payload && result.errorMessage) {
		console.warn('[academic-sync] extract payload failed', {
			errorCode: result.errorCode,
			errorMessage: result.errorMessage,
		})
	}
	return result.payload
}

export const mapTaskToEvent = (
	task: JsonObject,
	courseCode: string,
	index: number,
	courseName?: string
): AcademicEvent => {
	const stableId = typeof task.id === 'string' && task.id.trim() ? task.id.trim() : null
	const title =
		typeof task.name === 'string' ? task.name : typeof task.title === 'string' ? task.title : `Task ${index + 1}`
	const dueDate =
		typeof task.due_date_raw === 'string'
			? task.due_date_raw
			: typeof task.due_date === 'string'
				? task.due_date
				: new Date().toISOString().split('T')[0]
	const startAt =
		typeof task.start_at === 'string'
			? task.start_at
			: typeof task.startAt === 'string'
				? task.startAt
				: dueDate
	const endAt =
		typeof task.end_at === 'string'
			? task.end_at
			: typeof task.endAt === 'string'
				? task.endAt
				: typeof task.end_date === 'string'
					? task.end_date
					: undefined
	const allDay =
		typeof task.is_all_day === 'boolean'
			? task.is_all_day
			: typeof task.allDay === 'boolean'
				? task.allDay
				: !startAt.includes('T')
	const weight = parseWeightValue(task.weight)
	const type =
		typeof task.task_type_standardized === 'string'
			? task.task_type_standardized
			: typeof task.type === 'string'
				? task.type
				: 'Task'
	const highRisk = weight >= 30 || type === 'Exam'

	return {
		id: stableId || `ai-${courseCode}-${title}-${index}`.replace(/\s+/g, '-'),
		title,
		start: startAt,
		end: endAt,
		allDay,
		color: highRisk ? '#fbcfe8' : '#bbf7d0',
		weight,
		type,
		courseCode,
		taskCategory: 'academic',
		priority: highRisk ? 'high' : 'medium',
		extendedProps: {
			source: 'ai',
			taskCategory: 'academic',
			courseName,
			detail: typeof task.description === 'string' ? task.description : null,
			sourceQuote: typeof task.source_quote === 'string' ? task.source_quote : null,
			pageNumbers: Array.isArray(task.page_numbers) ? task.page_numbers : [],
			estimated_hours:
				typeof task.estimated_hours === 'number' && Number.isFinite(task.estimated_hours)
					? task.estimated_hours
					: typeof task.estimated_hours === 'string'
						? Number.parseFloat(task.estimated_hours.replace(/,/g, '')) || undefined
						: undefined,
			rationale: typeof task.rationale === 'string' ? task.rationale : undefined,
		},
	}
}

export const mergeUniqueEvents = (current: AcademicEvent[], incoming: AcademicEvent[]) => {
	const keyOf = (item: AcademicEvent) =>
		`${item.title}::${item.start}::${item.courseCode ?? ''}::${item.taskCategory ?? 'academic'}`
	const keys = new Set(current.map(keyOf))
	const unique = incoming.filter(item => {
		const key = keyOf(item)
		if (keys.has(key)) return false
		keys.add(key)
		return true
	})
	return [...current, ...unique]
}

export const buildCoursePlans = (events: AcademicEvent[], courseDetails: CourseDetail[] = []): CoursePlan[] => {
	const scoped = events.filter(item => item.taskCategory !== 'chores')
	const grouped = scoped.reduce<Record<string, AcademicEvent[]>>((acc, event) => {
		const code = event.courseCode || DEFAULT_COURSE
		acc[code] = acc[code] || []
		acc[code].push(event)
		return acc
	}, {})
	courseDetails.forEach(detail => {
		const code = detail.courseCode || DEFAULT_COURSE
		if (!grouped[code]) grouped[code] = []
	})

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
		const computedRate = Math.min(100, Math.round((completedWeight / 100) * 100))
		const detail = courseDetails.find(item => item.courseCode === courseCode)
		const override = detail?.manualCompletionRate
		const completionRate =
			typeof override === 'number' && Number.isFinite(override)
				? Math.max(0, Math.min(100, Math.round(override)))
				: computedRate

		return {
			id: `course-${courseCode}`,
			courseCode,
			courseName: detail?.courseName || detail?.name || courseCode,
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
	gradingPolicy: JsonObject | string
}) => {
	const { apiBase, userId, courseCode, gradingPolicy } = params
	if (!courseCode || courseCode === DEFAULT_COURSE) return null
	if (typeof gradingPolicy === 'string') {
		if (!gradingPolicy.trim()) return null
	} else if (!gradingPolicy) {
		return null
	}
	const parsed = parseGradingPolicyText(gradingPolicy as JsonValue)
	const fromObject =
		typeof gradingPolicy === 'object' && gradingPolicy && !Array.isArray(gradingPolicy) ? (gradingPolicy as JsonObject) : null

	const url = createApiUrl(apiBase, '/policies/save')
	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				courseCode,
				late_policy: fromObject?.late_policy != null ? fromObject.late_policy : parsed.latePolicy,
				absence_policy: fromObject?.absence_policy != null ? fromObject.absence_policy : parsed.absencePolicy,
				grading_notes: fromObject?.grading_notes != null ? fromObject.grading_notes : parsed.gradingNotes,
				rawPolicyText: parsed.rawPolicyText,
				extensionRule: parsed.extensionRule,
				integrityRule: parsed.integrityRule,
				collaborationRule: parsed.collaborationRule,
				examAidRule: parsed.examAidRule,
				parsedPolicyJson: parsed.parsedPolicyJson,
				rules: parsed.rules,
			}),
		})
	)
}

export const upsertCourseProfile = async (params: {
	apiBase: string
	userId: string
	courseCode: string
	name?: string | null
	courseName?: string | null
	description?: string | null
	sourceQuote?: string | null
	manualCompletionRate?: number | null
	manualSemesterProgress?: number | null
}) => {
	const { apiBase, userId, courseCode } = params
	if (!userId || !courseCode) return null
	const url = createApiUrl(apiBase, '/academic/course/upsert')
	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				courseCode,
				name: params.name ?? null,
				courseName: params.courseName ?? null,
				description: params.description ?? null,
				sourceQuote: params.sourceQuote ?? null,
				manualCompletionRate: params.manualCompletionRate ?? null,
				manualSemesterProgress: params.manualSemesterProgress ?? null,
			}),
		})
	)
}

/** Course codes that must not be bulk-deleted (shared buckets). */
export const PROTECTED_COURSE_CODES_FOR_DELETE = new Set(['UNKNOWN', 'GENERAL'])

export const isCourseCodeDeletable = (courseCode: string | null | undefined): boolean => {
	const code = typeof courseCode === 'string' ? courseCode.trim() : ''
	if (!code) return false
	return !PROTECTED_COURSE_CODES_FOR_DELETE.has(code)
}

export const deleteCourseBundle = async (params: { apiBase: string; userId: string; courseCode: string }) => {
	const { apiBase, userId, courseCode } = params
	const trimmed = typeof courseCode === 'string' ? courseCode.trim() : ''
	if (!userId || !trimmed || !isCourseCodeDeletable(trimmed)) {
		throw new Error('Invalid course or protected course code')
	}
	const url = createApiUrl(apiBase, '/academic/course/delete')
	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, courseCode: trimmed }),
		})
	)
}

export const renameCourseCode = async (params: {
	apiBase: string
	userId: string
	fromCourseCode: string
	toCourseCode: string
}) => {
	const { apiBase, userId, fromCourseCode, toCourseCode } = params
	const from = String(fromCourseCode || '').trim()
	const to = String(toCourseCode || '').trim()
	if (!userId || !from || !to) {
		throw new Error('Missing required params for course rename')
	}
	if (from === to) return { success: true }
	const url = createApiUrl(apiBase, '/academic/course/rename')
	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				fromCourseCode: from,
				toCourseCode: to,
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
	const toSafeTaskId = (event: AcademicEvent, index: number) => {
		const raw = String(event.id || '').trim()
		if (raw) return raw.slice(0, 180)
		const title = String(event.title || 'task').replace(/\s+/g, '-').slice(0, 80)
		const start = String(event.start || '').replace(/[^\dT:-]/g, '').slice(0, 24)
		return `task-${index}-${title}-${start}`.slice(0, 180)
	}
	const academicScoped = events.filter(item => item.taskCategory !== 'chores')
	const tasks = academicScoped
		.map((event, index) => ({
		id: toSafeTaskId(event, index),
		title: String(event.title || '').trim(),
		startAt: event.start,
		endAt: event.end || null,
		allDay: event.allDay ?? true,
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
		estimatedHours: (() => {
			const raw = event.extendedProps?.estimated_hours ?? event.extendedProps?.estimatedHours
			if (typeof raw === 'number' && Number.isFinite(raw)) return raw
			if (typeof raw === 'string') {
				const n = Number.parseFloat(raw.replace(/,/g, ''))
				return Number.isFinite(n) ? n : null
			}
			return null
		})(),
		rationale: typeof event.extendedProps?.rationale === 'string' ? event.extendedProps.rationale : null,
		courseName: typeof event.extendedProps?.courseName === 'string' ? event.extendedProps.courseName : null,
	}))
		.filter(item => item.id && item.title)

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

export const syncChoresTasks = async (params: { apiBase: string; userId: string; events: AcademicEvent[] }) => {
	const { apiBase, userId, events } = params
	const url = createApiUrl(apiBase, '/chores/sync')
	const tasks = events
		.filter(item => item.taskCategory === 'chores')
		.map(event => ({
			id: String(event.id || '').trim(),
			title: String(event.title || '').trim(),
			startAt: event.start,
			endAt: event.end || null,
			allDay: event.allDay ?? true,
			priority: event.priority || null,
			location:
				typeof event.extendedProps?.location === 'string' ? event.extendedProps.location : null,
			detail:
				typeof event.extendedProps?.detail === 'string'
					? event.extendedProps.detail
					: typeof event.extendedProps?.notes === 'string'
						? event.extendedProps.notes
						: null,
		}))
		.filter(item => item.id && item.title)

	return withRetry(() =>
		requestJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				tasks,
			}),
		})
	)
}

export const loadAcademicSnapshots = async (params: { apiBase: string; userId: string }) => {
	const overviewUrl = createApiUrl(params.apiBase, `/academic/overview?userId=${encodeURIComponent(params.userId)}`)
	try {
		const overview = await requestJson<{
			data?: {
				courses?: OverviewCourseItem[]
				policies?: OverviewPolicyItem[]
				rules?: OverviewPolicyRuleItem[]
				tasks?: OverviewTaskItem[]
				choreTasks?: OverviewChoreItem[]
				snapshots?: OverviewSnapshotItem[]
			}
		}>(overviewUrl)
		const data = overview.data || {}
		const tasks = Array.isArray(data.tasks) ? data.tasks : []
		const choreRows = Array.isArray(data.choreTasks) ? data.choreTasks : []
		const academicEvents = tasks.map((task, index) =>
			mapTaskToEvent(
				{
					id: task.id,
					title: task.title,
					due_date: task.due_date ?? undefined,
					start_at: task.start_at ?? undefined,
					end_at: task.end_at ?? undefined,
					is_all_day: task.is_all_day ?? undefined,
					weight: task.weight ?? undefined,
					type: task.type ?? undefined,
					detail: task.detail ?? undefined,
					source_quote: task.source_quote ?? undefined,
					page_numbers: task.page_numbers_json ? parseJsonSafe(task.page_numbers_json) ?? [] : [],
					estimated_hours: task.estimated_hours ?? undefined,
					rationale: task.rationale ?? undefined,
				},
				task.course_code || DEFAULT_COURSE,
				index,
				task.course_name || task.course_code || undefined
			)
		)
		const choreEvents = choreRows.map(row => mapChoreRowToEvent(row))
		const events = [...academicEvents, ...choreEvents]
		const toNum = (v: unknown): number | null => {
			if (v == null) return null
			const n = typeof v === 'number' ? v : Number(v)
			return Number.isFinite(n) ? n : null
		}
		const courses = (Array.isArray(data.courses) ? data.courses : []).map(
			item =>
				({
					courseCode: item.course_code,
					name: item.name ?? null,
					courseName: item.course_name ?? null,
					description: item.description ?? null,
					sourceQuote: item.source_quote ?? null,
					manualCompletionRate: toNum(
						(item as OverviewCourseItem & { manualCompletionRate?: unknown }).manualCompletionRate ?? item.manual_completion_rate
					),
					manualSemesterProgress: toNum(
						(item as OverviewCourseItem & { manualSemesterProgress?: unknown }).manualSemesterProgress ?? item.manual_semester_progress
					),
				}) satisfies CourseDetail
		)
		const policyRulesByPolicyId = new Map<string, CoursePolicyRule[]>()
		;(Array.isArray(data.rules) ? data.rules : []).forEach(rule => {
			const next: CoursePolicyRule = {
				id: rule.id,
				ruleType: rule.rule_type,
				thresholdValue: rule.threshold_value ?? null,
				penaltyPercent: rule.penalty_percent ?? null,
				timeUnit: rule.time_unit ?? null,
				rawQuote: rule.raw_quote ?? null,
				ruleOrder: rule.rule_order ?? null,
			}
			const list = policyRulesByPolicyId.get(rule.policy_id) || []
			list.push(next)
			policyRulesByPolicyId.set(rule.policy_id, list)
		})
		const policies = (Array.isArray(data.policies) ? data.policies : []).map(
			item =>
				({
					courseCode: item.course_code,
					rawPolicyText: item.raw_policy_text ?? null,
					latePolicy: item.late_policy ?? null,
					absencePolicy: item.absence_policy ?? null,
					gradingNotes: item.grading_notes ?? null,
					extensionRule: item.extension_rule ?? null,
					integrityRule: item.integrity_rule ?? null,
					collaborationRule: item.collaboration_rule ?? null,
					examAidRule: item.exam_aid_rule ?? null,
					rules: policyRulesByPolicyId.get(item.id) || [],
				}) satisfies CoursePolicyProfile
		)
		const snapshots = (Array.isArray(data.snapshots) ? data.snapshots : []).map(
			item =>
				({
					id: item.id,
					courseCode: item.course_code ?? null,
					sourceType: item.source_type ?? null,
					reportText: item.report_text ?? null,
					createdAt: item.created_at,
				}) satisfies IngestionSnapshotItem
		)

		return {
			events,
			courses: buildCoursePlans(events, courses),
			courseDetails: courses,
			coursePolicies: policies,
			snapshots,
		}
	} catch {
		// Fallback to legacy endpoint for compatibility
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
			courseDetails: [],
			coursePolicies: [],
			snapshots: [],
		}
	}
}
