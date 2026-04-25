import { DifyApi } from '@/utils/dify-api'
import config from '@/config'
import { createApiUrl } from './academic-sync'

type InputRecord = Record<string, unknown>

interface IAcademicOverviewData {
	courses?: unknown[]
	policies?: unknown[]
	rules?: unknown[]
	tasks?: unknown[]
	snapshots?: unknown[]
	processingResults?: unknown[]
}

interface IAcademicOverviewResponse {
	success?: boolean
	data?: IAcademicOverviewData
}

interface IAcademicContextPayload {
	tasks: unknown[]
	courses: unknown[]
	policies: unknown[]
	policyRules: unknown[]
	snapshots: unknown[]
	processingResults: unknown[]
}

interface IUploadLikeFile {
	upload_file_id?: string
	originFileObj?: File
	url?: string
	remote_url?: string
	name?: string
	filename?: string
	transfer_method?: 'local_file' | 'remote_url' | string
	type?: string
	uid?: string
	status?: string
}
type DifySerializableFile = {
	type: string
	transfer_method: 'local_file' | 'remote_url'
	upload_file_id?: string
	url?: string
}

const FILE_REFERENCE_ERROR_PATTERN =
	/(upload_file_id|file[_\s-]*(id|reference)|file.*not\s*found|invalid.*file|missing.*file|does not exist)/i

const ACADEMIC_CACHE_TTL = 30 * 1000

const academicCache = new Map<string, { expiresAt: number; payload: IAcademicContextPayload }>()
const generatedUploadSource = new Map<string, { filename: string; content: string; mimeType: string }>()
const generatedUploadCache = new Map<
	string,
	{ hash: string; fileRef: IUploadLikeFile; expiresAt: number }
>()

const IMPLICIT_REUPLOAD_DISABLED_KEY = 'IMPLICIT_REUPLOAD_DISABLED'

export const isImplicitReuploadDisabled = () => {
	if (typeof window === 'undefined') return false
	try {
		const flag = window.localStorage.getItem(IMPLICIT_REUPLOAD_DISABLED_KEY)
		return flag === '1' || flag === 'true'
	} catch {
		return false
	}
}

const isNonEmptyArray = (value: unknown) => Array.isArray(value) && value.length > 0

const shouldUseCurrentValue = (value: unknown) => {
	if (value === undefined || value === null) return false
	if (Array.isArray(value) && value.length === 0) return false
	return true
}

const isObject = (value: unknown): value is Record<string, unknown> => {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

const stringifySafe = (value: unknown) => {
	try {
		return JSON.stringify(value)
	} catch {
		return '[]'
	}
}

const computeHash = (text: string) => {
	let hash = 0
	for (let i = 0; i < text.length; i++) {
		hash = (hash << 5) - hash + text.charCodeAt(i)
		hash |= 0
	}
	return String(hash)
}

const fetchAcademicContext = async (userId: string): Promise<IAcademicContextPayload | null> => {
	if (!userId) return null
	const now = Date.now()
	const hit = academicCache.get(userId)
	if (hit && hit.expiresAt > now) {
		return hit.payload
	}

	const overviewUrl = createApiUrl(
		config.PUBLIC_APP_API_BASE || '',
		`/academic/overview?userId=${encodeURIComponent(userId)}`,
	)

	try {
		const response = await fetch(overviewUrl)
		if (!response.ok) {
			return null
		}
		const data = (await response.json()) as IAcademicOverviewResponse
		const payload: IAcademicContextPayload = {
			tasks: Array.isArray(data?.data?.tasks) ? data.data.tasks : [],
			courses: Array.isArray(data?.data?.courses) ? data.data.courses : [],
			policies: Array.isArray(data?.data?.policies) ? data.data.policies : [],
			policyRules: Array.isArray(data?.data?.rules) ? data.data.rules : [],
			snapshots: Array.isArray(data?.data?.snapshots) ? data.data.snapshots : [],
			processingResults: Array.isArray(data?.data?.processingResults)
				? data.data.processingResults
				: [],
		}
		academicCache.set(userId, {
			payload,
			expiresAt: now + ACADEMIC_CACHE_TTL,
		})
		return payload
	} catch {
		return null
	}
}

const normalizeUploadFileArray = (value: unknown) => {
	if (!shouldUseCurrentValue(value)) return [] as IUploadLikeFile[]
	if (Array.isArray(value)) {
		return value.filter(isObject).map(item => item as IUploadLikeFile)
	}
	if (isObject(value)) {
		return [value as IUploadLikeFile]
	}
	return [] as IUploadLikeFile[]
}

const toSerializableFile = (file: IUploadLikeFile): DifySerializableFile | null => {
	const transferMethod = file.transfer_method === 'remote_url' ? 'remote_url' : 'local_file'
	const type = file.type || 'document'
	if (transferMethod === 'local_file') {
		if (!file.upload_file_id) return null
		return {
			type,
			transfer_method: 'local_file',
			upload_file_id: file.upload_file_id,
		}
	}
	const remoteUrl = file.url || file.remote_url
	if (!remoteUrl) return null
	return {
		type,
		transfer_method: 'remote_url',
		url: remoteUrl,
	}
}

export const mergeConversationAndFormInputs = (
	storedInputs?: InputRecord,
	currentInputs?: InputRecord,
) => {
	const merged: InputRecord = { ...(storedInputs || {}) }
	Object.entries(currentInputs || {}).forEach(([key, value]) => {
		if (!shouldUseCurrentValue(value)) return
		merged[key] = value
	})
	return merged
}

export const sanitizeInputsForDify = (inputs: InputRecord, targetKeys: string[]) => {
	const nextInputs: InputRecord = { ...inputs }
	targetKeys.forEach(key => {
		const original = nextInputs[key]
		if (Array.isArray(original)) {
			const files = original
				.filter(isObject)
				.map(item => toSerializableFile(item as IUploadLikeFile))
				.filter((item): item is DifySerializableFile => !!item)
			if (files.length > 0) {
				nextInputs[key] = files
			} else {
				delete nextInputs[key]
			}
			return
		}
		if (isObject(original)) {
			const file = toSerializableFile(original as IUploadLikeFile)
			if (file) {
				nextInputs[key] = file
			} else {
				delete nextInputs[key]
			}
		}
	})
	return nextInputs
}

const ensureLocalSerializableFile = async (file: DifySerializableFile, difyApi: DifyApi) => {
	if (file.transfer_method === 'local_file' && file.upload_file_id) {
		return file
	}
	const sourceFile = await toUploadSourceFile({
		transfer_method: 'remote_url',
		url: file.url,
		remote_url: file.url,
		type: file.type,
	})
	if (!sourceFile) return null
	const uploaded = await difyApi.uploadFile(sourceFile)
	return {
		type: file.type || 'document',
		transfer_method: 'local_file' as const,
		upload_file_id: uploaded.id,
	}
}

export const prepareInputsForDify = async (params: {
	inputs: InputRecord
	targetKeys: string[]
	difyApi: DifyApi
	forceLocalFile?: boolean
}) => {
	const sanitized = sanitizeInputsForDify(params.inputs, params.targetKeys)
	if (!params.forceLocalFile) {
		return sanitized
	}
	const nextInputs: InputRecord = { ...sanitized }
	for (const key of params.targetKeys) {
		const value = nextInputs[key]
		if (Array.isArray(value)) {
			const files = value
				.filter(isObject)
				.map(item => item as DifySerializableFile)
			const localized = await Promise.all(
				files.map(file => ensureLocalSerializableFile(file, params.difyApi)),
			)
			nextInputs[key] = localized.filter((item): item is DifySerializableFile => !!item)
			continue
		}
		if (isObject(value)) {
			const localized = await ensureLocalSerializableFile(value as DifySerializableFile, params.difyApi)
			if (localized) {
				nextInputs[key] = localized
			}
		}
	}
	return nextInputs
}

const dedupeFiles = (files: IUploadLikeFile[]) => {
	const seen = new Set<string>()
	return files.filter(file => {
		const key = file.upload_file_id || file.url || file.remote_url || file.uid || ''
		if (!key) return true
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

const sanitizeFileToken = (value: string) => {
	return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)
}

const inferCourseToken = (payload: IAcademicContextPayload) => {
	const fromTasks = payload.tasks.find(item => isObject(item) && typeof item.course_code === 'string')
	if (fromTasks && isObject(fromTasks) && typeof fromTasks.course_code === 'string') {
		return sanitizeFileToken(fromTasks.course_code)
	}
	const fromCourses = payload.courses.find(item => isObject(item) && typeof item.course_code === 'string')
	if (fromCourses && isObject(fromCourses) && typeof fromCourses.course_code === 'string') {
		return sanitizeFileToken(fromCourses.course_code)
	}
	return 'general'
}

const escapeMarkdownCell = (value: unknown) => {
	if (value === null || value === undefined) return ''
	const text = typeof value === 'string' ? value : stringifySafe(value)
	return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

const formatAcademicContextAsMarkdown = (payload: IAcademicContextPayload) => {
	const lines: string[] = []
	const generatedAt = new Date().toISOString()
	lines.push('# Academic Context Snapshot')
	lines.push('')
	lines.push(`Generated at: ${generatedAt}`)
	lines.push('')

	const courses = payload.courses.filter(isObject) as Record<string, unknown>[]
	lines.push(`## Courses (${courses.length})`)
	if (courses.length === 0) {
		lines.push('_No courses recorded._')
	} else {
		lines.push('| Course Code | Course Name | Term |')
		lines.push('| --- | --- | --- |')
		courses.forEach(course => {
			lines.push(
				`| ${escapeMarkdownCell(course.course_code)} | ${escapeMarkdownCell(course.course_name)} | ${escapeMarkdownCell((course.term as unknown) || '')} |`,
			)
		})
	}
	lines.push('')

	const tasks = payload.tasks.filter(isObject) as Record<string, unknown>[]
	lines.push(`## Tasks (${tasks.length})`)
	if (tasks.length === 0) {
		lines.push('_No tasks recorded._')
	} else {
		tasks.forEach((task, index) => {
			const title = typeof task.title === 'string' ? task.title : `Task ${index + 1}`
			const courseCode =
				typeof task.course_code === 'string' && task.course_code ? task.course_code : 'UNKNOWN'
			lines.push(`### ${index + 1}. [${courseCode}] ${title}`)
			const due = typeof task.due_date === 'string' ? task.due_date : ''
			const start = typeof task.start_at === 'string' ? task.start_at : ''
			const end = typeof task.end_at === 'string' ? task.end_at : ''
			const taskType = typeof task.type === 'string' ? task.type : ''
			const weight = task.weight !== undefined && task.weight !== null ? String(task.weight) : ''
			const estHours =
				task.estimated_hours !== undefined && task.estimated_hours !== null
					? String(task.estimated_hours)
					: ''
			if (taskType) lines.push(`- Type: ${taskType}`)
			if (due) lines.push(`- Due: ${due}`)
			if (start) lines.push(`- Start: ${start}`)
			if (end) lines.push(`- End: ${end}`)
			if (weight) lines.push(`- Weight: ${weight}`)
			if (estHours) lines.push(`- Estimated hours: ${estHours}`)
			if (typeof task.detail === 'string' && task.detail.trim()) {
				lines.push('- Detail:')
				lines.push('')
				lines.push(task.detail.trim())
			}
			if (typeof task.source_quote === 'string' && task.source_quote.trim()) {
				lines.push('- Source quote:')
				lines.push('')
				lines.push(`> ${task.source_quote.trim().replace(/\r?\n/g, '\n> ')}`)
			}
			if (typeof task.rationale === 'string' && task.rationale.trim()) {
				lines.push(`- Rationale: ${task.rationale.trim()}`)
			}
			lines.push('')
		})
	}

	const policies = payload.policies.filter(isObject) as Record<string, unknown>[]
	lines.push(`## Course Policies (${policies.length})`)
	if (policies.length === 0) {
		lines.push('_No policies recorded._')
	} else {
		policies.forEach((policy, index) => {
			const courseCode =
				typeof policy.course_code === 'string' && policy.course_code ? policy.course_code : 'UNKNOWN'
			const summary = typeof policy.summary === 'string' ? policy.summary : ''
			lines.push(`### ${index + 1}. ${courseCode}`)
			if (summary) {
				lines.push(summary)
				lines.push('')
			}
		})
	}
	lines.push('')

	const policyRules = payload.policyRules.filter(isObject) as Record<string, unknown>[]
	lines.push(`## Policy Rules (${policyRules.length})`)
	if (policyRules.length === 0) {
		lines.push('_No policy rules recorded._')
	} else {
		lines.push('| Course | Rule Type | Detail |')
		lines.push('| --- | --- | --- |')
		policyRules.forEach(rule => {
			lines.push(
				`| ${escapeMarkdownCell(rule.course_code)} | ${escapeMarkdownCell(rule.rule_type)} | ${escapeMarkdownCell(rule.detail || rule.description || '')} |`,
			)
		})
	}
	lines.push('')

	return lines.join('\n')
}

const uploadAcademicPayloadAsFile = async (
	difyApi: DifyApi,
	userId: string,
	payload: IAcademicContextPayload,
) => {
	const markdown = formatAcademicContextAsMarkdown(payload)
	const hash = computeHash(markdown)
	const now = Date.now()
	const cacheHit = generatedUploadCache.get(userId)
	if (cacheHit && cacheHit.hash === hash && cacheHit.expiresAt > now) {
		console.log('[implicit-reupload] reuse cached upload', cacheHit.fileRef)
		return cacheHit.fileRef
	}

	const courseToken = inferCourseToken(payload)
	const filename = `academic-context-${courseToken}-${Date.now()}.md`
	const mimeType = 'text/markdown'
	const sourceFile = new File([markdown], filename, { type: mimeType })
	console.log('[implicit-reupload] uploading academic context', {
		filename,
		mimeType,
		size: sourceFile.size,
		hash,
		preview: markdown.slice(0, 160),
	})
	const upload = await difyApi.uploadFile(sourceFile)
	console.log('[implicit-reupload] upload response', {
		id: upload.id,
		name: upload.name,
		extension: upload.extension,
		mime_type: upload.mime_type,
		size: upload.size,
	})
	const fileRef: IUploadLikeFile = {
		uid: `auto-${upload.id}`,
		name: filename,
		filename,
		upload_file_id: upload.id,
		transfer_method: 'local_file',
		type: 'document',
		status: 'done',
	}
	generatedUploadSource.set(upload.id, {
		filename,
		content: markdown,
		mimeType,
	})
	generatedUploadCache.set(userId, {
		hash,
		fileRef,
		expiresAt: now + ACADEMIC_CACHE_TTL,
	})
	return fileRef
}

const applyTargetFileInput = (params: {
	inputs: InputRecord
	targetKey: 'Calendar' | 'Syllabus'
	autoFiles: IUploadLikeFile[]
	userFirst?: boolean
	forceArray?: boolean
}) => {
	const originalValue = params.inputs[params.targetKey]
	const userFiles = normalizeUploadFileArray(originalValue)
	const merged = params.userFirst
		? dedupeFiles([...userFiles, ...params.autoFiles])
		: dedupeFiles([...params.autoFiles, ...userFiles])
	if (!merged.length) return params.inputs
	const useArray = params.forceArray || Array.isArray(originalValue)
	const preferredSingle =
		merged.find(file => !!file.upload_file_id) ||
		merged.find(file => !!(file.url || file.remote_url)) ||
		merged[0]
	return {
		...params.inputs,
		[params.targetKey]: useArray ? merged : preferredSingle,
	}
}

const hasTargetKey = (inputs: InputRecord, key: string) => Object.prototype.hasOwnProperty.call(inputs, key)

const enrichInputsWithAcademicFile = async (params: {
	inputs: InputRecord
	userId?: string | null
	difyApi: DifyApi
	targetKey: 'Calendar' | 'Syllabus'
	requireTargetKey?: boolean
	forceArray?: boolean
}) => {
	const { inputs, userId, difyApi, targetKey } = params
	if (!userId) return inputs
	if (params.requireTargetKey !== false && !hasTargetKey(inputs, targetKey)) return inputs
	const payload = await fetchAcademicContext(userId)
	if (!payload) return inputs
	const autoFile = await uploadAcademicPayloadAsFile(difyApi, userId, payload)
	return applyTargetFileInput({
		inputs,
		targetKey,
		autoFiles: [autoFile],
		// 统一保持“用户本次上传优先，自动注入补充”
		userFirst: true,
		forceArray: params.forceArray ?? Array.isArray(inputs[targetKey]),
	})
}

export const enrichChatflowInputsWithCalendar = async (params: {
	inputs: InputRecord
	userId?: string | null
	difyApi: DifyApi
}) => {
	const { inputs } = params
	if (isImplicitReuploadDisabled()) {
		console.warn('[implicit-reupload] disabled by localStorage flag, skip Calendar enrichment')
		return inputs
	}
	return enrichInputsWithAcademicFile({
		...params,
		targetKey: 'Calendar',
		requireTargetKey: true,
		forceArray: Array.isArray(inputs.Calendar),
	})
}

export const enrichChatflowInputsWithSyllabus = async (params: {
	inputs: InputRecord
	userId?: string | null
	difyApi: DifyApi
}) => {
	const { inputs } = params
	if (isImplicitReuploadDisabled()) {
		console.warn('[implicit-reupload] disabled by localStorage flag, skip Syllabus enrichment')
		return inputs
	}
	return enrichInputsWithAcademicFile({
		...params,
		targetKey: 'Syllabus',
		// chatflow 即使表单没有显式 Syllabus 字段，也允许隐式注入该变量
		requireTargetKey: false,
		forceArray: true,
	})
}

export const enrichWorkflowInputsWithSyllabus = async (params: {
	inputs: InputRecord
	userId?: string | null
	difyApi: DifyApi
}) => {
	const { inputs } = params
	if (isImplicitReuploadDisabled()) {
		console.warn('[implicit-reupload] disabled by localStorage flag, skip Syllabus enrichment')
		return inputs
	}
	return enrichInputsWithAcademicFile({
		...params,
		targetKey: 'Syllabus',
		requireTargetKey: true,
		forceArray: true,
	})
}

const parseErrorText = async (response: Response) => {
	try {
		return await response.clone().text()
	} catch {
		return ''
	}
}

const isFileReferenceError = async (response: Response) => {
	if (response.ok) return false
	const text = await parseErrorText(response)
	return FILE_REFERENCE_ERROR_PATTERN.test(text)
}

const toUploadSourceFile = async (value: IUploadLikeFile) => {
	if (value.upload_file_id && generatedUploadSource.has(value.upload_file_id)) {
		const source = generatedUploadSource.get(value.upload_file_id)!
		return new File([source.content], source.filename, { type: source.mimeType })
	}

	if (value.originFileObj instanceof File) {
		return value.originFileObj
	}

	const sourceUrl = value.url || value.remote_url
	if (!sourceUrl) return null
	try {
		const response = await fetch(sourceUrl)
		if (!response.ok) return null
		const blob = await response.blob()
		const filename = value.name || value.filename || `academic-file-${Date.now()}`
		return new File([blob], filename, { type: blob.type || undefined })
	} catch {
		return null
	}
}

const refreshSingleUploadRef = async (value: unknown, difyApi: DifyApi) => {
	if (!isObject(value)) return { changed: false, nextValue: value }
	const fileLike = value as IUploadLikeFile
	if (!fileLike.upload_file_id) return { changed: false, nextValue: value }

	const sourceFile = await toUploadSourceFile(fileLike)
	if (!sourceFile) return { changed: false, nextValue: value }

	try {
		const upload = await difyApi.uploadFile(sourceFile)
		return {
			changed: true,
			nextValue: {
				...value,
				upload_file_id: upload.id,
				transfer_method: 'local_file',
			},
		}
	} catch {
		return { changed: false, nextValue: value }
	}
}

const refreshInputFileReferences = async (
	inputs: InputRecord,
	difyApi: DifyApi,
	targetKeys?: string[],
) => {
	const nextInputs: InputRecord = { ...inputs }
	let changed = false

	for (const [key, value] of Object.entries(nextInputs)) {
		if (targetKeys?.length && !targetKeys.includes(key)) {
			continue
		}
		if (Array.isArray(value)) {
			if (!isNonEmptyArray(value)) continue
			let arrayChanged = false
			const refreshedItems = await Promise.all(
				value.map(async item => {
					const refreshed = await refreshSingleUploadRef(item, difyApi)
					if (refreshed.changed) {
						arrayChanged = true
					}
					return refreshed.nextValue
				}),
			)
			if (arrayChanged) {
				nextInputs[key] = refreshedItems
				changed = true
			}
			continue
		}

		const refreshed = await refreshSingleUploadRef(value, difyApi)
		if (refreshed.changed) {
			nextInputs[key] = refreshed.nextValue
			changed = true
		}
	}

	return {
		changed,
		nextInputs,
	}
}

export const executeWithInputFileRetry = async (params: {
	inputs: InputRecord
	difyApi: DifyApi
	request: (nextInputs: InputRecord) => Promise<Response>
	targetKeys?: string[]
}) => {
	const firstResponse = await params.request(params.inputs)
	if (!(await isFileReferenceError(firstResponse))) {
		return {
			response: firstResponse,
			inputs: params.inputs,
			retried: false,
		}
	}

	const refreshed = await refreshInputFileReferences(params.inputs, params.difyApi, params.targetKeys)
	if (!refreshed.changed) {
		return {
			response: firstResponse,
			inputs: params.inputs,
			retried: false,
		}
	}

	const secondResponse = await params.request(refreshed.nextInputs)
	return {
		response: secondResponse,
		inputs: refreshed.nextInputs,
		retried: true,
	}
}
