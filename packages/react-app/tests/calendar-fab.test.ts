import { describe, expect, test } from 'vitest'

import { shouldShowCalendarQuickAddFab } from '@/lib/calendar-fab'

describe('calendar quick-add FAB', () => {
	test('should show only for day and agenda views', () => {
		expect(shouldShowCalendarQuickAddFab('timeGridDay')).toBe(true)
		expect(shouldShowCalendarQuickAddFab('listWeek')).toBe(true)
		expect(shouldShowCalendarQuickAddFab('dayGridMonth')).toBe(false)
		expect(shouldShowCalendarQuickAddFab('timeGridWeek')).toBe(false)
		expect(shouldShowCalendarQuickAddFab('multiMonthYear')).toBe(false)
	})
})
