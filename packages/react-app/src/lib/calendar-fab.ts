import type { CalendarViewType } from '@/store/academic-planner'

/** Views that show the bottom-right floating quick-add (+) control. */
export const CALENDAR_QUICK_ADD_FAB_VIEWS: CalendarViewType[] = ['timeGridDay', 'listWeek']

export function shouldShowCalendarQuickAddFab(view: CalendarViewType): boolean {
	return CALENDAR_QUICK_ADD_FAB_VIEWS.includes(view)
}
