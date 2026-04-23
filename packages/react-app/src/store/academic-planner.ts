import { create } from 'zustand'

export type PlannerUiMode = 'calendar' | 'planner'
export type PlannerSyncStatus = 'idle' | 'syncing' | 'success' | 'error'
export type CalendarViewType =
	| 'multiMonthYear'
	| 'dayGridMonth'
	| 'timeGridWeek'
	| 'timeGridDay'
	| 'listWeek'

export type TaskCategory = 'academic' | 'chores'

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
	/** Defaults to academic when omitted (legacy events). */
	taskCategory?: TaskCategory
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

export interface CoursePolicyRule {
	id: string
	ruleType: string
	thresholdValue?: number | null
	penaltyPercent?: number | null
	timeUnit?: string | null
	rawQuote?: string | null
	ruleOrder?: number | null
}

export interface CoursePolicyProfile {
	courseCode: string
	rawPolicyText?: string | null
	latePolicy?: string | null
	absencePolicy?: string | null
	gradingNotes?: string | null
	extensionRule?: string | null
	integrityRule?: string | null
	collaborationRule?: string | null
	examAidRule?: string | null
	rules: CoursePolicyRule[]
}

export interface CourseDetail {
	courseCode: string
	name?: string | null
	courseName?: string | null
	description?: string | null
	sourceQuote?: string | null
	/** 0–100; when set, overrides computed course completion in planner */
	manualCompletionRate?: number | null
	/** 0–100; when set and this course is selected, overrides semester bar */
	manualSemesterProgress?: number | null
}

export interface IngestionSnapshotItem {
	id: string
	courseCode?: string | null
	sourceType?: string | null
	reportText?: string | null
	createdAt?: string
}

interface PlannerState {
	uiMode: PlannerUiMode
	calendarViewType: CalendarViewType
	selectedCourseId: string | null
	semesterProgress: number
	events: AcademicEvent[]
	courses: CoursePlan[]
	courseDetails: CourseDetail[]
	coursePolicies: CoursePolicyProfile[]
	snapshots: IngestionSnapshotItem[]
	syncStatus: PlannerSyncStatus
	lastSyncError: string | null
	lastOperationSnapshot: AcademicEvent[] | null
	setUiMode: (mode: PlannerUiMode) => void
	setCalendarViewType: (view: CalendarViewType) => void
	setSelectedCourseId: (id: string | null) => void
	setSemesterProgress: (progress: number) => void
	setEvents: (events: AcademicEvent[]) => void
	upsertEvent: (event: AcademicEvent) => void
	updateEvent: (id: string, patch: Partial<AcademicEvent>) => void
	removeEvent: (id: string) => void
	setCourses: (courses: CoursePlan[]) => void
	setCourseDetails: (items: CourseDetail[]) => void
	setCoursePolicies: (items: CoursePolicyProfile[]) => void
	setSnapshots: (items: IngestionSnapshotItem[]) => void
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
	courseDetails: [],
	coursePolicies: [],
	snapshots: [],
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
	updateEvent: (id, patch) =>
		set(state => ({
			events: state.events.map(item => (item.id === id ? { ...item, ...patch } : item)),
		})),
	removeEvent: id => set(state => ({ events: state.events.filter(item => item.id !== id) })),
	setCourses: courses => set({ courses }),
	setCourseDetails: items => set({ courseDetails: items }),
	setCoursePolicies: items => set({ coursePolicies: items }),
	setSnapshots: items => set({ snapshots: items }),
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
