import { afterEach, describe, expect, test, vi } from 'vitest'

import {
	createApiUrl,
	extractAcademicPayloadFromText,
	loadAcademicSnapshots,
	mapTaskToEvent,
	mergeUniqueEvents,
	normalizeAcademicPayload,
	saveJsonToDatabase,
	syncAcademicTasks,
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

	test('loadAcademicSnapshots should convert snapshot records to events and courses', async () => {
		const rawData = JSON.stringify({
			courses: [
				{
					course_info: { course_code: 'AIE1902' },
					deadlines: [{ title: 'Final Exam', due_date: '2026-06-01', weight: '50%', task_type_standardized: 'Exam' }],
				},
			],
		})
		const fetchMock = vi.fn(async () => ({
			ok: true,
			json: async () => ({ data: [{ rawData, courseCode: 'AIE1902' }] }),
			text: async () => '',
		}))
		vi.stubGlobal('fetch', fetchMock)

		const result = await loadAcademicSnapshots({
			apiBase: '',
			userId: 'user-123',
		})

		expect(result.events).toHaveLength(1)
		expect(result.events[0]?.title).toBe('Final Exam')
		expect(result.events[0]?.weight).toBe(50)
		expect(result.courses).toHaveLength(1)
		expect(result.courses[0]?.courseCode).toBe('AIE1902')
	})
})
