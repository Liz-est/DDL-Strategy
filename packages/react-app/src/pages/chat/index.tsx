"use client"

import './chat-workspace.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { EditOutlined } from '@ant-design/icons'
import { Button, DatePicker, Input, InputNumber, Modal, Segmented, Select, Switch, Tag, message } from 'antd'
import CoursePlannerEditDrawer from '@/components/planner/CoursePlannerEditDrawer'
import type { DateSelectArg } from '@fullcalendar/core'
import CalendarView from '@/components/CalendarView'
import CoursePlanBoard from '@/components/planner/CoursePlanBoard'
import RiskHeatPanel from '@/components/planner/RiskHeatPanel'
import SemesterProgress from '@/components/planner/SemesterProgress'
import config from '@/config/runtime-config'
import { useAuth } from '@/hooks/use-auth'
import ChatLayoutWrapper from '@/layout/chat-layout-wrapper'
import {
	buildCoursePlans,
	extractAcademicPayloadFromText,
	loadAcademicSnapshots,
	mapTaskToEvent,
	mergeUniqueEvents,
	saveCoursePolicies,
	saveJsonToDatabase,
	syncAcademicTasks,
	syncChoresTasks,
} from '@/services/academic-sync'
import { type AcademicEvent, type TaskCategory, useAcademicPlannerStore } from '@/store/academic-planner'

const LOCAL_DRAFT_KEY = 'academic-events-draft-v1'

const getSemesterProgress = (events: AcademicEvent[]) => {
	const academic = events.filter(item => item.taskCategory !== 'chores')
	if (academic.length === 0) return 0
	const sorted = [...academic].sort((a, b) => a.start.localeCompare(b.start))
	const start = dayjs(sorted[0].start)
	const end = dayjs(sorted[sorted.length - 1].start)
	const totalDays = Math.max(end.diff(start, 'day'), 1)
	const elapsed = Math.min(Math.max(dayjs().diff(start, 'day'), 0), totalDays)
	return Math.round((elapsed / totalDays) * 100)
}

export default function ChatPage() {
	const { userId } = useAuth()
	const apiBase = useMemo(() => (config.PUBLIC_APP_API_BASE || '').replace(/\/$/, ''), [])
	const {
		uiMode,
		calendarViewType,
		selectedCourseId,
		semesterProgress,
		events,
		courses,
		syncStatus,
		lastSyncError,
		lastOperationSnapshot,
		setUiMode,
		setCalendarViewType,
		setSelectedCourseId,
		setSemesterProgress,
		setEvents,
		upsertEvent,
		removeEvent,
		setCourses,
		courseDetails,
		coursePolicies,
		snapshots,
		setCourseDetails,
		setCoursePolicies,
		setSnapshots,
		setSyncStatus,
		saveSnapshot,
		restoreSnapshot,
	} = useAcademicPlannerStore()
	const [plannerEditCourseId, setPlannerEditCourseId] = useState<string | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
	const [editingEventId, setEditingEventId] = useState<string | null>(null)
	const [newEventTitle, setNewEventTitle] = useState('')
	const [selectedTimeRange, setSelectedTimeRange] = useState<[string, string | undefined] | null>(null)
	const [isAllDayEvent, setIsAllDayEvent] = useState(false)
	const [eventCourseCode, setEventCourseCode] = useState('MANUAL')
	const [eventType, setEventType] = useState('Task')
	const [eventWeight, setEventWeight] = useState(0)
	const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
	const [taskCategory, setTaskCategory] = useState<TaskCategory>('academic')
	const [choreLocation, setChoreLocation] = useState('')
	const [choreNotes, setChoreNotes] = useState('')
	const [hasInitialized, setHasInitialized] = useState(false)
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const observeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastPayloadFingerprint = useRef<string>('')
	const syncedCourseCodesRef = useRef<Set<string>>(new Set())
	const choresDirtyRef = useRef(false)

	const getDefaultTimeRange = (allDay = false): [string, string] => {
		if (allDay) {
			const start = dayjs().format('YYYY-MM-DD')
			const end = dayjs().add(1, 'day').format('YYYY-MM-DD')
			return [start, end]
		}
		const startAt = dayjs().startOf('hour')
		const endAt = startAt.add(1, 'hour')
		return [startAt.format('YYYY-MM-DDTHH:mm:ss'), endAt.format('YYYY-MM-DDTHH:mm:ss')]
	}

	const pressureInfo = useMemo(() => {
		const totalWeight = events
			.filter(e => e.taskCategory !== 'chores')
			.reduce((acc, curr) => acc + (curr.weight || 0), 0)
		if (totalWeight > 50) return { label: 'High Risk', color: 'red' }
		return { label: 'Balanced', color: 'green' }
	}, [events])

	useEffect(() => {
		let active = true
		if (!userId) {
			setHasInitialized(true)
			setSyncStatus('idle')
			return () => {
				active = false
			}
		}
		const hydrate = async () => {
			setSyncStatus('syncing')
			try {
				const {
					events: remoteEvents,
					courseDetails: remoteCourseDetails,
					coursePolicies: remoteCoursePolicies,
					snapshots: remoteSnapshots,
				} = await loadAcademicSnapshots({
					apiBase,
					userId,
				})
				if (!active) return
				// Always merge against latest store — async hydrate must not use a stale
				// `events` closure (often []) or it will wipe AI-imported tasks that landed first.
				const localEvents = useAcademicPlannerStore.getState().events
				const merged = mergeUniqueEvents(localEvents, remoteEvents)
				const finalEvents = merged.length > 0 ? merged : localEvents
				setEvents(finalEvents)
				setCourses(buildCoursePlans(finalEvents, remoteCourseDetails))
				setCourseDetails(remoteCourseDetails)
				setCoursePolicies(remoteCoursePolicies)
				setSnapshots(remoteSnapshots)
				setSemesterProgress(getSemesterProgress(finalEvents))
				choresDirtyRef.current = false
				localStorage.removeItem(LOCAL_DRAFT_KEY)
				setSyncStatus('success')
			} catch (error) {
				if (!active) return
				const localDraft = localStorage.getItem(LOCAL_DRAFT_KEY)
				if (localDraft) {
					try {
						const parsed = JSON.parse(localDraft) as AcademicEvent[]
						setEvents(parsed)
						setCourses(buildCoursePlans(parsed, []))
						setCourseDetails([])
						setCoursePolicies([])
						setSnapshots([])
						setSemesterProgress(getSemesterProgress(parsed))
					} catch {
						// no-op
					}
				}
				setSyncStatus('error', (error as Error).message)
			} finally {
				if (active) {
					setHasInitialized(true)
				}
			}
		}

		void hydrate()
		return () => {
			active = false
		}
	}, [apiBase, setCourseDetails, setCoursePolicies, setCourses, setEvents, setSemesterProgress, setSnapshots, setSyncStatus, userId])

	useEffect(() => {
		setCourses(buildCoursePlans(events, courseDetails))
		setSemesterProgress(getSemesterProgress(events))
	}, [courseDetails, events, setCourses, setSemesterProgress])

	useEffect(() => {
		if (!userId) return
		if (!hasInitialized) return
		if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
		syncTimerRef.current = setTimeout(() => {
			const academicScoped = events.filter(item => item.taskCategory !== 'chores')
			const choreEvents = events.filter(item => item.taskCategory === 'chores')
			const grouped = academicScoped.reduce<Record<string, AcademicEvent[]>>((acc, item) => {
				const key = item.courseCode || 'GENERAL'
				acc[key] = acc[key] || []
				acc[key].push(item)
				return acc
			}, {})
			const currentCourseCodes = new Set(Object.keys(grouped))
			const codesToSync = new Set<string>([...Array.from(syncedCourseCodesRef.current), ...Array.from(currentCourseCodes)])
			void (async () => {
				try {
					setSyncStatus('syncing')
					const jobs: Promise<unknown>[] = Array.from(codesToSync).map(courseCode =>
						syncAcademicTasks({
							apiBase,
							userId,
							courseCode,
							events: grouped[courseCode] || [],
						})
					)
					if (choreEvents.length > 0 || choresDirtyRef.current) {
						jobs.push(syncChoresTasks({ apiBase, userId, events: choreEvents }))
					}
					await Promise.all(jobs)
					syncedCourseCodesRef.current = currentCourseCodes
					choresDirtyRef.current = false
					localStorage.removeItem(LOCAL_DRAFT_KEY)
					setSyncStatus('success')
				} catch (error) {
					localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(events))
					setSyncStatus('error', (error as Error).message)
				}
			})()
		}, 1200)

		return () => {
			if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
		}
	}, [apiBase, events, hasInitialized, setSyncStatus, userId])

	useEffect(() => {
		const observer = new MutationObserver(() => {
			if (observeTimerRef.current) clearTimeout(observeTimerRef.current)
			observeTimerRef.current = setTimeout(() => {
				const content = document.body?.innerText || ''
				const payload = extractAcademicPayloadFromText(content)
				if (!payload) return

				const firstTaskTitle =
					typeof payload.rows[0]?.task?.title === 'string'
						? payload.rows[0].task.title
						: typeof payload.rows[0]?.task?.name === 'string'
							? payload.rows[0].task.name
							: ''
				const fingerprint = `${payload.courseCode}-${payload.rows.length}-${firstTaskTitle}`
				if (fingerprint === lastPayloadFingerprint.current) return
				lastPayloadFingerprint.current = fingerprint

				const newEvents = payload.rows.map((row, index) =>
					mapTaskToEvent(row.task, row.courseCode, index, row.courseName)
				)
				const merged = mergeUniqueEvents(useAcademicPlannerStore.getState().events, newEvents)
				if (merged.length === useAcademicPlannerStore.getState().events.length) return

				setEvents(merged)
				setCourses(buildCoursePlans(merged, useAcademicPlannerStore.getState().courseDetails))
				if (userId) {
					void saveJsonToDatabase({
						apiBase,
						userId,
						courseCode: payload.courseCode,
						jsonData: payload.parsed,
						adviceText: payload.advice,
						courseSummaryJson: payload.courseSummaryJson,
						description: `Extracted ${newEvents.length} tasks`,
					})
					if (payload.gradingPolicy) {
						void saveCoursePolicies({
							apiBase,
							userId,
							courseCode: payload.courseCode,
							gradingPolicy: payload.gradingPolicy,
						})
					}
				}
				message.success(`Imported ${newEvents.length} tasks from AI result`)
			}, 900)
		})

		const target = document.body || document.documentElement
		observer.observe(target, {
			childList: true,
			subtree: true,
			characterData: true,
		})

		return () => {
			observer.disconnect()
			if (observeTimerRef.current) clearTimeout(observeTimerRef.current)
		}
	}, [apiBase, setCourses, setEvents, userId])

	const resetEditor = () => {
		setEditingEventId(null)
		setModalMode('create')
		setNewEventTitle('')
		setEventCourseCode('MANUAL')
		setEventType('Task')
		setEventWeight(0)
		setIsAllDayEvent(false)
		setPriority('medium')
		setTaskCategory('academic')
		setChoreLocation('')
		setChoreNotes('')
		setSelectedTimeRange(getDefaultTimeRange(false))
	}

	const openCreateModal = (range?: [string, string | undefined], allDay?: boolean) => {
		const shouldAllDay = Boolean(allDay)
		setModalMode('create')
		setEditingEventId(null)
		setTaskCategory('academic')
		setEventCourseCode('MANUAL')
		setEventType('Task')
		setEventWeight(0)
		setPriority('medium')
		setChoreLocation('')
		setChoreNotes('')
		setNewEventTitle('')
		setIsAllDayEvent(shouldAllDay)
		setSelectedTimeRange(range || getDefaultTimeRange(shouldAllDay))
		setIsModalOpen(true)
	}

	const handleDateSelect = (selectInfo: DateSelectArg) => {
		const view = useAcademicPlannerStore.getState().calendarViewType
		if (view !== 'timeGridWeek' && view !== 'timeGridDay') return
		const allDay = !(selectInfo.startStr.includes('T') || (selectInfo.endStr || '').includes('T'))
		openCreateModal([selectInfo.startStr, selectInfo.endStr], allDay)
	}

	const handleQuickAdd = () => {
		openCreateModal()
	}

	const handleEventClick = (eventId: string) => {
		const target = events.find(item => item.id === eventId)
		if (!target) return
		const cat: TaskCategory = target.taskCategory === 'chores' ? 'chores' : 'academic'
		setModalMode('edit')
		setEditingEventId(target.id)
		setTaskCategory(cat)
		setNewEventTitle(target.title)
		setEventCourseCode(target.courseCode || 'MANUAL')
		setEventType(target.type || 'Task')
		setEventWeight(target.weight || 0)
		setPriority(target.priority || 'medium')
		setChoreLocation(typeof target.extendedProps?.location === 'string' ? target.extendedProps.location : '')
		setChoreNotes(
			typeof target.extendedProps?.detail === 'string'
				? target.extendedProps.detail
				: typeof target.extendedProps?.notes === 'string'
					? target.extendedProps.notes
					: ''
		)
		const allDay = target.allDay ?? !target.start.includes('T')
		setIsAllDayEvent(allDay)
		setSelectedTimeRange([target.start, target.end || target.start])
		setIsModalOpen(true)
	}

	const handleModalClose = () => {
		setIsModalOpen(false)
		resetEditor()
	}

	const handleModalOk = async () => {
		if (!newEventTitle.trim()) {
			message.warning('Please enter a task name')
			return
		}
		if (!selectedTimeRange?.[0]) {
			message.warning('Please choose a valid date range')
			return
		}
		const [start, end] = selectedTimeRange
		if (end && dayjs(end).isBefore(dayjs(start))) {
			message.warning('End time must be later than start time')
			return
		}
		if (taskCategory === 'academic') {
			const highRisk = eventType === 'Exam' || eventWeight >= 30
			const normalizedCourseCode = eventCourseCode.trim() || 'MANUAL'
			const nextEvent: AcademicEvent = {
				id: editingEventId || `user-${Date.now()}`,
				title: newEventTitle.trim(),
				start,
				end,
				allDay: isAllDayEvent,
				color: highRisk ? '#fbcfe8' : '#bbf7d0',
				weight: eventWeight,
				type: eventType,
				courseCode: normalizedCourseCode,
				taskCategory: 'academic',
				priority,
				extendedProps: { source: 'manual', taskCategory: 'academic' },
			}
			saveSnapshot()
			upsertEvent(nextEvent)
		} else {
			const nextEvent: AcademicEvent = {
				id: editingEventId || `chore-${Date.now()}`,
				title: newEventTitle.trim(),
				start,
				end,
				allDay: isAllDayEvent,
				taskCategory: 'chores',
				type: 'Chore',
				color: '#bbf7d0',
				priority,
				extendedProps: {
					taskCategory: 'chores',
					location: choreLocation.trim() || undefined,
					detail: choreNotes.trim() || undefined,
				},
			}
			saveSnapshot()
			upsertEvent(nextEvent)
			choresDirtyRef.current = true
		}
		handleModalClose()
		message.success(modalMode === 'edit' ? 'Task updated' : 'Task added to calendar')
	}

	const handleDeleteEvent = async () => {
		if (!editingEventId) return
		const target = events.find(item => item.id === editingEventId)
		if (!target) return
		Modal.confirm({
			title: 'Delete this task?',
			content: 'This action removes the task from your calendar and synced planner data.',
			okText: 'Delete',
			okButtonProps: { danger: true },
			cancelText: 'Cancel',
			onOk: async () => {
				saveSnapshot()
				if (target.taskCategory === 'chores') choresDirtyRef.current = true
				removeEvent(editingEventId)
				handleModalClose()
				message.success('Task deleted')
			},
		})
	}

	const handleCalendarEventChange = async (updatedEvent: {
		id: string
		title: string
		start: string
		end?: string
		allDay?: boolean
	}) => {
		const snapshot = useAcademicPlannerStore.getState().events
		saveSnapshot()
		const nextEvents = snapshot.map(item =>
			item.id === updatedEvent.id
				? { ...item, title: updatedEvent.title, start: updatedEvent.start, end: updatedEvent.end, allDay: updatedEvent.allDay }
				: item
		)
		setEvents(nextEvents)

		const changed = nextEvents.find(item => item.id === updatedEvent.id)
		if (!changed) return false
		if (!userId) return true

		try {
			setSyncStatus('syncing')
			if (changed.taskCategory === 'chores') {
				choresDirtyRef.current = true
				await syncChoresTasks({
					apiBase,
					userId,
					events: nextEvents.filter(item => item.taskCategory === 'chores'),
				})
			} else {
				await syncAcademicTasks({
					apiBase,
					userId,
					courseCode: changed.courseCode || 'GENERAL',
					events: nextEvents.filter(
						item =>
							item.taskCategory !== 'chores' &&
							(item.courseCode || 'GENERAL') === (changed.courseCode || 'GENERAL')
					),
				})
			}
			setSyncStatus('success')
			return true
		} catch (error) {
			setEvents(snapshot)
			setSyncStatus('error', (error as Error).message)
			message.error('Update failed, reverted to previous schedule')
			return false
		}
	}

	const syncStatusTag = useMemo(() => {
		if (syncStatus === 'syncing') return <Tag color="processing">Syncing</Tag>
		if (syncStatus === 'error') return <Tag color="error">Sync Failed</Tag>
		if (syncStatus === 'success') return <Tag color="success">Synced</Tag>
		return <Tag>Idle</Tag>
	}, [syncStatus])

	const selectedCourseEvents = (
		selectedCourseId
			? events.filter(item => `course-${item.courseCode || 'UNKNOWN'}` === selectedCourseId)
			: events
	).filter(item => item.taskCategory !== 'chores')
	const selectedCourseCode = selectedCourseId?.replace(/^course-/, '') || null
	const selectedCourseDetail = selectedCourseCode
		? courseDetails.find(item => item.courseCode === selectedCourseCode)
		: null
	const selectedCoursePolicy = selectedCourseCode
		? coursePolicies.find(item => item.courseCode === selectedCourseCode)
		: null

	const effectiveSemesterProgress = useMemo(() => {
		const m = selectedCourseDetail?.manualSemesterProgress
		if (m != null && Number.isFinite(m)) return Math.max(0, Math.min(100, Math.round(m)))
		return semesterProgress
	}, [selectedCourseDetail?.manualSemesterProgress, semesterProgress])

	const refetchPlanner = useCallback(async () => {
		if (!userId) return
		setSyncStatus('syncing')
		try {
			const r = await loadAcademicSnapshots({ apiBase, userId })
			// Replace from server: merging with local would resurrect rows the user deleted on the server
			// (delete course / delete tasks) because mergeUniqueEvents only appends, never removes.
			setEvents(r.events)
			setCourses(buildCoursePlans(r.events, r.courseDetails))
			setCourseDetails(r.courseDetails)
			setCoursePolicies(r.coursePolicies)
			setSnapshots(r.snapshots)
			setSemesterProgress(getSemesterProgress(r.events))
			setSyncStatus('success')
		} catch (error) {
			setSyncStatus('error', (error as Error).message)
		}
	}, [
		userId,
		apiBase,
		setSyncStatus,
		setEvents,
		setCourses,
		setCourseDetails,
		setCoursePolicies,
		setSnapshots,
		setSemesterProgress,
	])

	return (
		<div className="chat-workspace flex h-screen w-screen overflow-hidden bg-slate-100">
			<aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-4 py-4">
					<p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Academic Workspace</p>
					<h2 className="mt-1 text-lg font-bold text-slate-800">DDL Strategist</h2>
				</div>
				<div className="space-y-2 p-3">
					<button
						type="button"
						className={`planner-mode-toggle w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition outline-none ring-offset-0 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
							uiMode === 'calendar'
								? 'bg-indigo-100 text-indigo-950 shadow-sm ring-1 ring-indigo-200/90'
								: 'bg-slate-100 text-slate-800 hover:bg-slate-200/90'
						}`}
						onClick={() => setUiMode('calendar')}
					>
						Calendar
					</button>
					<button
						type="button"
						className={`planner-mode-toggle w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition outline-none ring-offset-0 focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
							uiMode === 'planner'
								? 'bg-indigo-100 text-indigo-950 shadow-sm ring-1 ring-indigo-200/90'
								: 'bg-slate-100 text-slate-800 hover:bg-slate-200/90'
						}`}
						onClick={() => setUiMode('planner')}
					>
						Course Planner
					</button>
				</div>
				<div className="planner-scroll flex-1 overflow-y-auto border-t border-slate-200 p-3">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">All Stored Courses</p>
						<div className="space-y-2">
						{courses.map(course => (
							<div
								key={course.id}
								className={`flex min-w-0 items-stretch gap-1 rounded-lg border py-1.5 pl-2 pr-1.5 transition ${
									selectedCourseId === course.id
										? 'border-indigo-400 bg-indigo-50'
										: 'border-slate-200 bg-white'
								}`}
							>
								<button
									type="button"
									onClick={() => setSelectedCourseId(course.id)}
									className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
								>
									<p className="truncate text-sm font-semibold text-slate-800" title={course.courseCode}>
										{course.courseCode}
									</p>
									<p className="text-xs text-slate-600">{course.milestones.length} tasks</p>
								</button>
								<button
									type="button"
									aria-label="Edit course"
									className="chat-stored-course-edit flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-md border-0 bg-slate-100/90 p-0 text-slate-500 shadow-none outline-none ring-0 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-0"
									onClick={e => {
										e.stopPropagation()
										setSelectedCourseId(course.id)
										setPlannerEditCourseId(course.id)
									}}
								>
									<EditOutlined className="text-[15px]" />
								</button>
							</div>
						))}
						{courses.length === 0 ? <p className="text-xs text-slate-600">No courses synced yet.</p> : null}
					</div>
				</div>
			</aside>

			<section className="flex h-full min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
					<div>
						<h1 className="text-lg font-bold text-slate-800">
							{uiMode === 'calendar' ? 'Calendar Scheduling' : 'Planner Insights'}
						</h1>
						<p className="text-xs text-slate-600">
							{courses.length} courses · {events.length} tasks · {snapshots.length} snapshots
						</p>
					</div>
					<div className="flex items-center gap-2">
						{syncStatusTag}
						<Tag color={pressureInfo.color}>{pressureInfo.label}</Tag>
						<Button
							size="small"
							type="default"
							onClick={restoreSnapshot}
							disabled={!lastOperationSnapshot}
							className="text-slate-800"
						>
							Undo
						</Button>
					</div>
				</header>

				<main className="flex-1 overflow-hidden p-4">
					{uiMode === 'calendar' ? (
						<div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
							<CalendarView
								events={events}
								currentView={calendarViewType}
								onViewChange={setCalendarViewType}
								onEventClick={handleEventClick}
								onEventChange={handleCalendarEventChange}
								onDateSelect={handleDateSelect}
								onQuickAdd={handleQuickAdd}
							/>
						</div>
					) : (
						<div className="grid h-full grid-cols-12 gap-4">
							<div className="col-span-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
								<div className="planner-scroll h-full overflow-y-auto p-4">
									<CoursePlanBoard
										courses={courses}
										selectedCourseId={selectedCourseId}
										onSelectCourse={setSelectedCourseId}
									/>
								</div>
							</div>

							<div className="planner-scroll col-span-4 flex h-full flex-col gap-3 overflow-y-auto">
								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-800">Course Profile</h3>
									<p className="mt-2 text-xs text-slate-600">
										{selectedCourseDetail?.courseName || selectedCourseDetail?.name || selectedCourseCode || 'Select a course'}
									</p>
									{selectedCourseDetail?.description ? (
										<p className="mt-2 line-clamp-5 text-xs text-slate-600">{selectedCourseDetail.description}</p>
									) : (
										<p className="mt-2 text-xs text-slate-600">No course description stored.</p>
									)}
								</div>

								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-800">Policy Snapshot</h3>
									{selectedCoursePolicy?.rawPolicyText ? (
										<>
											<p className="mt-2 line-clamp-4 text-xs text-slate-600">{selectedCoursePolicy.rawPolicyText}</p>
											<div className="mt-2 space-y-1 text-xs text-slate-600">
												{selectedCoursePolicy.extensionRule ? <p>Extension: {selectedCoursePolicy.extensionRule}</p> : null}
												{selectedCoursePolicy.integrityRule ? <p>Integrity: {selectedCoursePolicy.integrityRule}</p> : null}
												{selectedCoursePolicy.examAidRule ? <p>Exam aid: {selectedCoursePolicy.examAidRule}</p> : null}
												<p>Parsed rules: {selectedCoursePolicy.rules.length}</p>
											</div>
										</>
									) : (
										<p className="mt-2 text-xs text-slate-600">No policy parsed for current course.</p>
									)}
								</div>

								<SemesterProgress semesterProgress={effectiveSemesterProgress} events={selectedCourseEvents} />
								<RiskHeatPanel events={selectedCourseEvents} />

								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-800">Ingestion History</h3>
									<div className="planner-scroll mt-2 max-h-40 space-y-2 overflow-y-auto">
										{snapshots.slice(0, 8).map(item => (
											<div key={item.id} className="rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-600">
												<p className="font-medium">{item.courseCode || 'UNKNOWN'}</p>
												<p>{item.sourceType || 'academic'} · {item.createdAt ? dayjs(item.createdAt).format('MM-DD HH:mm') : '--'}</p>
											</div>
										))}
										{snapshots.length === 0 ? <p className="text-xs text-slate-600">No snapshots yet.</p> : null}
									</div>
								</div>

								{syncStatus === 'error' && lastSyncError ? (
									<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
										Sync error: {lastSyncError}
									</div>
								) : null}
							</div>
						</div>
					)}
				</main>
			</section>

			<div className="chat-workspace z-20 h-full w-[420px] border-l border-slate-200 bg-white shadow-2xl">
				<ChatLayoutWrapper />
			</div>

			<Modal
				rootClassName="chat-workspace"
				title={modalMode === 'edit' ? 'Edit calendar item' : 'New calendar item'}
				open={isModalOpen}
				onOk={() => {
					void handleModalOk()
				}}
				onCancel={handleModalClose}
				okText={modalMode === 'edit' ? 'Save changes' : 'Add to calendar'}
				cancelText="Cancel"
				okButtonProps={{
					className: '!bg-indigo-200 !text-slate-900 !border-indigo-300 hover:!bg-indigo-300 !font-semibold',
				}}
				cancelButtonProps={{
					className: '!text-slate-800',
				}}
			>
				<div className="space-y-3 py-2">
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-slate-600">Category</p>
						<Segmented<TaskCategory>
							block
							disabled={modalMode === 'edit'}
							value={taskCategory}
							onChange={value => setTaskCategory(value as TaskCategory)}
							options={[
								{ label: 'Academic', value: 'academic' },
								{ label: 'Chores / personal', value: 'chores' },
							]}
						/>
						<p className="mt-1 text-xs text-slate-600">
							{taskCategory === 'academic'
								? 'Course-linked assessments and deadlines sync with your planner.'
								: 'Personal errands and life tasks are stored separately from academic data.'}
						</p>
					</div>
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-slate-600">Title</p>
						<Input
							placeholder={taskCategory === 'academic' ? 'e.g. Midterm review' : 'e.g. Groceries, dentist'}
							value={newEventTitle}
							onChange={event => setNewEventTitle(event.target.value)}
							onPressEnter={() => void handleModalOk()}
							autoFocus
						/>
					</div>
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-slate-600">Time</p>
						<div className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">
							{selectedTimeRange?.[0]} {selectedTimeRange?.[1] ? `→ ${selectedTimeRange[1]}` : ''}
						</div>
					</div>
					<div className="flex items-center justify-between rounded-md bg-slate-50 p-2 text-sm text-slate-700">
						<span>All-day</span>
						<Switch checked={isAllDayEvent} onChange={setIsAllDayEvent} />
					</div>
					{taskCategory === 'academic' ? (
						<div className="grid grid-cols-2 gap-3">
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Course code</p>
								<Input value={eventCourseCode} onChange={event => setEventCourseCode(event.target.value)} />
							</div>
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Assessment type</p>
								<Select
									value={eventType}
									onChange={value => setEventType(value)}
									options={[
										{ value: 'Task', label: 'Task' },
										{ value: 'Exam', label: 'Exam' },
										{ value: 'Project', label: 'Project' },
										{ value: 'Quiz', label: 'Quiz' },
									]}
									className="w-full"
								/>
							</div>
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Weight (%)</p>
								<InputNumber
									min={0}
									max={100}
									value={eventWeight}
									onChange={value => setEventWeight(Number(value) || 0)}
									className="w-full"
								/>
							</div>
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Priority</p>
								<Select
									value={priority}
									onChange={value => setPriority(value)}
									options={[
										{ value: 'low', label: 'Low' },
										{ value: 'medium', label: 'Medium' },
										{ value: 'high', label: 'High' },
									]}
									className="w-full"
								/>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-3">
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Location (optional)</p>
								<Input
									placeholder="e.g. Campus mailroom"
									value={choreLocation}
									onChange={e => setChoreLocation(e.target.value)}
								/>
							</div>
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Notes (optional)</p>
								<Input.TextArea
									rows={3}
									placeholder="Anything you want to remember"
									value={choreNotes}
									onChange={e => setChoreNotes(e.target.value)}
								/>
							</div>
							<div>
								<p className="mb-2 text-xs font-bold uppercase text-slate-600">Priority</p>
								<Select
									value={priority}
									onChange={value => setPriority(value)}
									options={[
										{ value: 'low', label: 'Low' },
										{ value: 'medium', label: 'Medium' },
										{ value: 'high', label: 'High' },
									]}
									className="w-full"
								/>
							</div>
						</div>
					)}
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-slate-600">Adjust date & time</p>
						<DatePicker.RangePicker
							className="w-full"
							showTime={!isAllDayEvent}
							format={isAllDayEvent ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'}
							value={
								selectedTimeRange?.[0]
									? [
											dayjs(selectedTimeRange[0]),
											selectedTimeRange[1] ? dayjs(selectedTimeRange[1]) : dayjs(selectedTimeRange[0]),
										]
									: null
							}
							onChange={value => {
								if (!value?.[0]) return
								setSelectedTimeRange([
									value[0].format(isAllDayEvent ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss'),
									value[1] ? value[1].format(isAllDayEvent ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss') : undefined,
								])
							}}
						/>
					</div>
					{modalMode === 'edit' ? (
						<div className="border-t border-slate-200 pt-3">
							<Button danger block onClick={() => void handleDeleteEvent()}>
								Delete
							</Button>
						</div>
					) : null}
				</div>
			</Modal>

			<CoursePlannerEditDrawer
				open={Boolean(plannerEditCourseId)}
				onClose={() => setPlannerEditCourseId(null)}
				courseId={plannerEditCourseId}
				userId={userId}
				apiBase={apiBase}
				courseDetails={courseDetails}
				coursePolicies={coursePolicies}
				courses={courses}
				onRefetch={refetchPlanner}
				onCourseSaved={(nextCourseCode, previousCourseCode) => {
					if (selectedCourseId === `course-${previousCourseCode}`) {
						setSelectedCourseId(`course-${nextCourseCode}`)
					}
				}}
				onCourseDeleted={deletedCode => {
					setPlannerEditCourseId(null)
					if (selectedCourseId === `course-${deletedCode}`) {
						setSelectedCourseId(null)
					}
				}}
			/>
		</div>
	)
}