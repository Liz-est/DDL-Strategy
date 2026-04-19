import { afterEach, describe, expect, test, vi } from 'vitest'

import {
	createApiUrl,
	extractAcademicPayloadFromText,
	loadAcademicSnapshots,
	mapChoreRowToEvent,
	mapTaskToEvent,
	mergeUniqueEvents,
	normalizeAcademicPayload,
	parseGradingPolicyText,
	saveJsonToDatabase,
	syncAcademicTasks,
	syncChoresTasks,
} from '@/services/academic-sync'
import type { AcademicEvent } from '@/store/academic-planner'

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

describe('academic-sync utilities', () => {
	test('createApiUrl should support configured and default api base', () => {
		expect(createApiUrl('https://example.com/api/', '/academic/sync')).toBe(
			'https://example.com/api/academic/sync'
		)
		expect(createApiUrl('', '/academic/sync')).toBe('/api/client/academic/sync')
	})

	test('extractAcademicPayloadFromText should parse markdown json and trailing commas', () => {
		const text = `AI result:
\`\`\`json
{
  "course_info": { "course_code": "AIE1902", },
  "assessments": [
    { "name": "Project", "due_date_raw": "2026-04-01", "weight": 30, "task_type_standardized": "Project", },
  ],
  "grading_policy": { "late_policy": "penalty" }
}
\`\`\`
`
		const payload = extractAcademicPayloadFromText(text)
		expect(payload).not.toBeNull()
		expect(payload?.courseCode).toBe('AIE1902')
		expect(payload?.taskList).toHaveLength(1)
		expect(payload?.taskList[0]?.name).toBe('Project')
	})

	test('extractAcademicPayloadFromText should parse new courses/deadlines format', () => {
		const text = JSON.stringify({
			courses: [
				{
					course_info: { name: 'AI Exploration II', course_name: 'AI Exploration II' },
					deadlines: [{ title: 'Final project', due_date: '2026-04-17', weight: '30%', task_type_standardized: 'Project' }],
				},
			],
			advice: 'start early',
		})
		const payload = extractAcademicPayloadFromText(text)
		expect(payload).not.toBeNull()
		expect(payload?.rows).toHaveLength(1)
		expect(payload?.rows[0]?.courseCode).toBe('AI Exploration II')
		expect(payload?.advice).toBe('start early')
	})

	test('extractAcademicPayloadFromText should parse courses JSON with noisy DOM prefix and trailing report', () => {
		const core = JSON.stringify({
			courses: [
				{
					course_info: { name: 'AI Exploration II' },
					deadlines: [
						{ title: 'Lab', due_date: '2026-01-09', weight: '20%' },
						{ title: 'Final', due_date: '2026-04-10', weight: '30%' },
					],
				},
			],
		})
		const noisy =
			'{ broken: true } nav { x: 1 } \n' +
			core +
			'\n\nSemester Preparation Report — Reference Date: 2026-04-10\nThis tail is long enough to be captured as advice text after the JSON block ends.'
		const payload = extractAcademicPayloadFromText(noisy)
		expect(payload?.rows).toHaveLength(2)
		expect(payload?.advice?.includes('Semester Preparation Report')).toBe(true)
	})

	test('normalizeAcademicPayload should parse courses JSON string payload', () => {
		const normalized = normalizeAcademicPayload({
			courses: JSON.stringify([
				{
					course_info: { course_code: 'AIE1902' },
					deadlines: [{ title: 'Midterm', due_date: '2026-03-20', weight: '30%' }],
				},
			]),
		})
		expect(normalized).not.toBeNull()
		expect(normalized?.rows[0]?.courseCode).toBe('AIE1902')
		expect(normalized?.rows).toHaveLength(1)
	})

	test('normalizeAcademicPayload should fallback when course_name is empty string', () => {
		const normalized = normalizeAcademicPayload({
			courses: [
				{
					course_info: { name: 'Honours Optimization', course_name: '' },
					deadlines: [{ title: 'Midterm Exam', due_date: '2026-03-13', weight: '40%' }],
				},
			],
		})
		expect(normalized?.rows[0]?.courseCode).toBe('Honours Optimization')
	})

	test('mapTaskToEvent should parse percentage weight and due_date', () => {
		const event = mapTaskToEvent(
			{
				title: 'Proposal',
				due_date: '2026-02-13',
				weight: '20%',
				task_type_standardized: 'Project',
			},
			'AIE1902',
			0
		)
		expect(event.start).toBe('2026-02-13')
		expect(event.weight).toBe(20)
	})

	test('mapTaskToEvent should reuse stable id when provided', () => {
		const event = mapTaskToEvent(
			{
				id: 'task-stable-1',
				title: 'Stable task',
				due_date: '2026-03-01',
			},
			'AIE1902',
			0
		)
		expect(event.id).toBe('task-stable-1')
	})

	test('parseGradingPolicyText should extract strict late rules', () => {
		const parsed = parseGradingPolicyText(
			'Up to 24 hours late: 20% deduction. 24-48 hours late: 40% deduction. More than 48 hours late: not accepted (score = 0). Extensions are granted only in documented emergencies.'
		)
		expect(parsed.rules.length).toBeGreaterThanOrEqual(3)
		expect(parsed.extensionRule?.includes('Extensions')).toBe(true)
	})

	test('mergeUniqueEvents should treat academic and chores with same title as distinct', () => {
		const current: AcademicEvent[] = [
			{
				id: '1',
				title: 'Buy book',
				start: '2026-04-10',
				courseCode: 'AIE1902',
				taskCategory: 'academic',
			},
		]
		const incoming: AcademicEvent[] = [
			{
				id: '2',
				title: 'Buy book',
				start: '2026-04-10',
				taskCategory: 'chores',
			},
		]
		const merged = mergeUniqueEvents(current, incoming)
		expect(merged).toHaveLength(2)
	})

	test('mergeUniqueEvents should deduplicate by title/start/courseCode', () => {
		const current: AcademicEvent[] = [
			{
				id: '1',
				title: 'Quiz 1',
				start: '2026-04-10',
				courseCode: 'AIE1902',
			},
		]
		const incoming: AcademicEvent[] = [
			{
				id: 'dup',
				title: 'Quiz 1',
				start: '2026-04-10',
				courseCode: 'AIE1902',
			},
			{
				id: '2',
				title: 'Final Exam',
				start: '2026-05-20',
				courseCode: 'AIE1902',
			},
		]
		const merged = mergeUniqueEvents(current, incoming)
		expect(merged).toHaveLength(2)
		expect(merged.map(item => item.title)).toEqual(['Quiz 1', 'Final Exam'])
	})
})

describe('academic-sync requests', () => {
	test('saveJsonToDatabase should post expected payload', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({ success: true }),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		await saveJsonToDatabase({
			apiBase: '',
			userId: 'user-123',
			courseCode: 'AIE1902',
			jsonData: { assessments: [] },
			adviceText: 'advice text',
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('/api/client/document/save')
		const payload = JSON.parse((init.body as string) || '{}')
		expect(payload.userId).toBe('user-123')
		expect(payload.courseCode).toBe('AIE1902')
		expect(payload.sourceType).toBe('academic')
		expect(payload.adviceText).toBe('advice text')
	})

	test('syncAcademicTasks should throw on failed request for rollback flow', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: false,
			json: async () => ({}),
			text: async () => 'sync failed',
		}))
		vi.stubGlobal('fetch', fetchMock)

		await expect(
			syncAcademicTasks({
				apiBase: '',
				userId: 'user-123',
				courseCode: 'AIE1902',
				events: [
					{
						id: 'event-1',
						title: 'Project',
						start: '2026-05-01',
						weight: 40,
						type: 'Project',
					},
				],
			})
		).rejects.toThrow('sync failed')
		expect(fetchMock).toHaveBeenCalledTimes(3)
	})

	test('mapChoreRowToEvent should map overview row to chores calendar event', () => {
		const event = mapChoreRowToEvent({
			id: 'chore-1',
			title: 'Groceries',
			start_at: '2026-04-20',
			end_at: '2026-04-20T12:00:00.000Z',
			is_all_day: true,
			priority: 'low',
			location: 'Store',
			detail: 'Milk',
		})
		expect(event.taskCategory).toBe('chores')
		expect(event.extendedProps?.location).toBe('Store')
		expect(event.extendedProps?.detail).toBe('Milk')
	})

	test('syncAcademicTasks should strip chores from payload', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({ success: true }),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		await syncAcademicTasks({
			apiBase: '',
			userId: 'user-123',
			courseCode: 'AIE1902',
			events: [
				{
					id: 'a1',
					title: 'Exam',
					start: '2026-05-01',
					courseCode: 'AIE1902',
					taskCategory: 'academic',
				},
				{
					id: 'c1',
					title: 'Laundry',
					start: '2026-05-02',
					taskCategory: 'chores',
				},
			],
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		const payload = JSON.parse((init.body as string) || '{}')
		expect(payload.tasks).toHaveLength(1)
		expect(payload.tasks[0].id).toBe('a1')
	})

	test('syncChoresTasks should post to chores sync endpoint', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({ success: true }),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		await syncChoresTasks({
			apiBase: '',
			userId: 'user-123',
			events: [
				{
					id: 'c1',
					title: 'Dentist',
					start: '2026-06-01',
					taskCategory: 'chores',
					extendedProps: { location: 'Clinic', detail: 'Bring card' },
				},
			],
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe('/api/client/chores/sync')
		const payload = JSON.parse((init.body as string) || '{}')
		expect(payload.tasks[0].location).toBe('Clinic')
	})

	test('syncAcademicTasks should send empty tasks for reconciliation delete', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({ success: true }),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		await syncAcademicTasks({
			apiBase: '',
			userId: 'user-123',
			courseCode: 'AIE1902',
			events: [],
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		const payload = JSON.parse((init.body as string) || '{}')
		expect(payload.tasks).toEqual([])
	})

	test('loadAcademicSnapshots should convert snapshot records to events and courses', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({
				data: {
					courses: [{ course_code: 'AIE1902', course_name: 'AIE1902' }],
					policies: [{ id: 'policy-1', course_code: 'AIE1902', raw_policy_text: 'late policy' }],
					rules: [{ id: 'rule-1', policy_id: 'policy-1', rule_type: 'late_penalty', penalty_percent: 20 }],
					tasks: [
						{
							id: 'task-1',
							title: 'Final Exam',
							course_code: 'AIE1902',
							type: 'Exam',
							weight: 50,
							due_date: '2026-06-01',
							is_all_day: true,
						},
					],
					snapshots: [{ id: 'snap-1', course_code: 'AIE1902', source_type: 'academic' }],
				},
			}),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		const result = await loadAcademicSnapshots({
			apiBase: '',
			userId: 'user-123',
		})

		expect(result.events).toHaveLength(1)
		expect(result.events[0]?.id).toBe('task-1')
		expect(result.events[0]?.title).toBe('Final Exam')
		expect(result.events[0]?.weight).toBe(50)
		expect(result.courses).toHaveLength(1)
		expect(result.courses[0]?.courseCode).toBe('AIE1902')
		expect(result.coursePolicies).toHaveLength(1)
		expect(result.courseDetails).toHaveLength(1)
	})

	test('loadAcademicSnapshots should merge choreTasks into events', async () => {
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({
				data: {
					courses: [],
					policies: [],
					rules: [],
					tasks: [
						{
							id: 'task-1',
							title: 'Final Exam',
							course_code: 'AIE1902',
							due_date: '2026-06-01',
							is_all_day: true,
						},
					],
					choreTasks: [
						{
							id: 'chore-1',
							title: 'Groceries',
							start_at: '2026-06-02',
							is_all_day: true,
						},
					],
					snapshots: [],
				},
			}),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		const result = await loadAcademicSnapshots({
			apiBase: '',
			userId: 'user-123',
		})

		expect(result.events).toHaveLength(2)
		expect(result.events.some(e => e.id === 'chore-1' && e.taskCategory === 'chores')).toBe(true)
		expect(result.events.some(e => e.id === 'task-1' && e.taskCategory === 'academic')).toBe(true)
	})
})
