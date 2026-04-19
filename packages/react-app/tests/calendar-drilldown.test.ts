import { describe, expect, test } from 'vitest'

import { getNextCalendarViewForDrill } from '@/lib/calendar-drilldown'

describe('calendar drill-down', () => {
	test('year zooms to month', () => {
		expect(getNextCalendarViewForDrill('multiMonthYear')).toBe('dayGridMonth')
	})
	test('month zooms to week', () => {
		expect(getNextCalendarViewForDrill('dayGridMonth')).toBe('timeGridWeek')
	})
	test('week zooms to day', () => {
		expect(getNextCalendarViewForDrill('timeGridWeek')).toBe('timeGridDay')
	})
	test('agenda zooms to day', () => {
		expect(getNextCalendarViewForDrill('listWeek')).toBe('timeGridDay')
	})
	test('day has no further zoom', () => {
		expect(getNextCalendarViewForDrill('timeGridDay')).toBeNull()
	})
})
