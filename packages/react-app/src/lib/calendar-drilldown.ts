import type { CalendarViewType } from '@/store/academic-planner'

/** Next view when user clicks a date cell (hierarchical zoom). */
export function getNextCalendarViewForDrill(current: CalendarViewType): CalendarViewType | null {
	if (current === 'multiMonthYear') return 'dayGridMonth'
	if (current === 'dayGridMonth') return 'timeGridWeek'
	if (current === 'timeGridWeek') return 'timeGridDay'
	if (current === 'listWeek') return 'timeGridDay'
	return null
}
