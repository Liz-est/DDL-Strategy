import { create } from 'zustand'

export type PlannerUiMode = 'calendar' | 'planner'
export type PlannerSyncStatus = 'idle' | 'syncing' | 'success' | 'error'
export type CalendarViewType =
	| 'multiMonthYear'
	| 'dayGridMonth'
	| 'timeGridWeek'
	| 'timeGridDay'
	| 'listWeek'

export interface AcademicEvent {
	id: string
	title: string
	start: string
	end?: string
	allDay?: boolean
	color?: string
	weight?: number
	type?: string
	courseCode?: string
	priority?: 'low' | 'medium' | 'high'
	extendedProps?: Record<string, unknown>
}

export interface CourseMilestone {
	id: string
	title: string
	dueDate: string
	weight: number
	type: string
}

export interface CoursePlan {
	id: string
	courseCode: string
	courseName: string
	completionRate: number
	milestones: CourseMilestone[]
}

interface PlannerState {
	uiMode: PlannerUiMode
	calendarViewType: CalendarViewType
	selectedCourseId: string | null
	semesterProgress: number
	events: AcademicEvent[]
	courses: CoursePlan[]
	syncStatus: PlannerSyncStatus
	lastSyncError: string | null
	lastOperationSnapshot: AcademicEvent[] | null
	setUiMode: (mode: PlannerUiMode) => void
	setCalendarViewType: (view: CalendarViewType) => void
	setSelectedCourseId: (id: string | null) => void
	setSemesterProgress: (progress: number) => void
	setEvents: (events: AcademicEvent[]) => void
	upsertEvent: (event: AcademicEvent) => void
	removeEvent: (id: string) => void
	setCourses: (courses: CoursePlan[]) => void
	setSyncStatus: (status: PlannerSyncStatus, error?: string | null) => void
	saveSnapshot: () => void
	restoreSnapshot: () => void
}

export const useAcademicPlannerStore = create<PlannerState>((set, get) => ({
	uiMode: 'calendar',
	calendarViewType: 'dayGridMonth',
	selectedCourseId: null,
	semesterProgress: 0,
	events: [],
	courses: [],
	syncStatus: 'idle',
	lastSyncError: null,
	lastOperationSnapshot: null,
	setUiMode: mode => set({ uiMode: mode }),
	setCalendarViewType: view => set({ calendarViewType: view }),
	setSelectedCourseId: id => set({ selectedCourseId: id }),
	setSemesterProgress: progress =>
		set({ semesterProgress: Math.max(0, Math.min(100, progress)) }),
	setEvents: events => set({ events }),
	upsertEvent: event =>
		set(state => {
			const exists = state.events.some(item => item.id === event.id)
			if (exists) {
				return {
					events: state.events.map(item => (item.id === event.id ? { ...item, ...event } : item)),
				}
			}
			return { events: [...state.events, event] }
		}),
	removeEvent: id => set(state => ({ events: state.events.filter(item => item.id !== id) })),
	setCourses: courses => set({ courses }),
	setSyncStatus: (status, error = null) =>
		set({
			syncStatus: status,
			lastSyncError: status === 'error' ? error ?? 'Unknown sync error' : null,
		}),
	saveSnapshot: () => set(state => ({ lastOperationSnapshot: [...state.events] })),
	restoreSnapshot: () => {
		const snapshot = get().lastOperationSnapshot
		if (snapshot) {
			set({ events: snapshot, lastOperationSnapshot: null })
		}
	},
}))
