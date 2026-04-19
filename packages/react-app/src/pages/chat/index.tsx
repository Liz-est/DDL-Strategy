"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Button, DatePicker, Input, InputNumber, Modal, Select, Switch, Tag, message } from 'antd'
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
} from '@/services/academic-sync'
import { type AcademicEvent, useAcademicPlannerStore } from '@/store/academic-planner'

const LOCAL_DRAFT_KEY = 'academic-events-draft-v1'

const getSemesterProgress = (events: AcademicEvent[]) => {
	if (events.length === 0) return 0
	const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start))
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
	const [hasInitialized, setHasInitialized] = useState(false)
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const observeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastPayloadFingerprint = useRef<string>('')
	const syncedCourseCodesRef = useRef<Set<string>>(new Set())

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
		const totalWeight = events.reduce((acc, curr) => acc + (curr.weight || 0), 0)
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
			const grouped = events.reduce<Record<string, AcademicEvent[]>>((acc, item) => {
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
					await Promise.all(
						Array.from(codesToSync).map(courseCode =>
							syncAcademicTasks({
								apiBase,
								userId,
								courseCode,
								events: grouped[courseCode] || [],
							})
						)
					)
					syncedCourseCodesRef.current = currentCourseCodes
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
		setSelectedTimeRange(getDefaultTimeRange(false))
	}

	const openCreateModal = (range?: [string, string | undefined], allDay?: boolean) => {
		const shouldAllDay = Boolean(allDay)
		setModalMode('create')
		setEditingEventId(null)
		setEventCourseCode('MANUAL')
		setEventType('Task')
		setEventWeight(0)
		setPriority('medium')
		setNewEventTitle('')
		setIsAllDayEvent(shouldAllDay)
		setSelectedTimeRange(range || getDefaultTimeRange(shouldAllDay))
		setIsModalOpen(true)
	}

	const handleDateSelect = (selectInfo: DateSelectArg) => {
		const allDay = !(selectInfo.startStr.includes('T') || (selectInfo.endStr || '').includes('T'))
		openCreateModal([selectInfo.startStr, selectInfo.endStr], allDay)
	}

	const handleQuickAdd = () => {
		openCreateModal()
	}

	const handleEventClick = (eventId: string) => {
		const target = events.find(item => item.id === eventId)
		if (!target) return
		setModalMode('edit')
		setEditingEventId(target.id)
		setNewEventTitle(target.title)
		setEventCourseCode(target.courseCode || 'MANUAL')
		setEventType(target.type || 'Task')
		setEventWeight(target.weight || 0)
		setPriority(target.priority || 'medium')
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
		const highRisk = eventType === 'Exam' || eventWeight >= 30
		const normalizedCourseCode = eventCourseCode.trim() || 'MANUAL'
		const nextEvent: AcademicEvent = {
			id: editingEventId || `user-${Date.now()}`,
			title: newEventTitle.trim(),
			start,
			end,
			allDay: isAllDayEvent,
			color: highRisk ? '#ef4444' : '#8b5cf6',
			weight: eventWeight,
			type: eventType,
			courseCode: normalizedCourseCode,
			priority,
			extendedProps: { source: 'manual' },
		}
		saveSnapshot()
		upsertEvent(nextEvent)
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
			await syncAcademicTasks({
				apiBase,
				userId,
				courseCode: changed.courseCode || 'GENERAL',
				events: nextEvents.filter(item => (item.courseCode || 'GENERAL') === (changed.courseCode || 'GENERAL')),
			})
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

	const selectedCourseEvents = selectedCourseId
		? events.filter(item => `course-${item.courseCode || 'UNKNOWN'}` === selectedCourseId)
		: events
	const selectedCourseCode = selectedCourseId?.replace(/^course-/, '') || null
	const selectedCourseDetail = selectedCourseCode
		? courseDetails.find(item => item.courseCode === selectedCourseCode)
		: null
	const selectedCoursePolicy = selectedCourseCode
		? coursePolicies.find(item => item.courseCode === selectedCourseCode)
		: null

	return (
		<div className="flex h-screen w-screen overflow-hidden bg-slate-100">
			<aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
				<div className="border-b border-slate-200 px-4 py-4">
					<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Academic Workspace</p>
					<h2 className="mt-1 text-lg font-bold text-slate-800">DDL Strategist</h2>
				</div>
				<div className="space-y-2 p-3">
					<button
						type="button"
						className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
							uiMode === 'calendar'
								? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-sm shadow-indigo-200'
								: 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
						}`}
						onClick={() => setUiMode('calendar')}
					>
						Calendar
					</button>
					<button
						type="button"
						className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
							uiMode === 'planner'
								? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-sm shadow-indigo-200'
								: 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
						}`}
						onClick={() => setUiMode('planner')}
					>
						Course Planner
					</button>
				</div>
				<div className="flex-1 overflow-y-auto border-t border-slate-200 p-3">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">All Stored Courses</p>
					<div className="space-y-2">
						{courses.map(course => (
							<button
								key={course.id}
								type="button"
								onClick={() => setSelectedCourseId(course.id)}
								className={`w-full rounded-lg border px-3 py-2 text-left transition ${
									selectedCourseId === course.id
										? 'border-indigo-400 bg-indigo-50'
										: 'border-slate-200 bg-white hover:border-slate-300'
								}`}
							>
								<p className="truncate text-sm font-semibold text-slate-800">{course.courseCode}</p>
								<p className="text-xs text-slate-500">{course.milestones.length} tasks</p>
							</button>
						))}
						{courses.length === 0 ? <p className="text-xs text-slate-400">No courses synced yet.</p> : null}
					</div>
				</div>
			</aside>

			<section className="flex h-full min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
					<div>
						<h1 className="text-lg font-bold text-slate-800">
							{uiMode === 'calendar' ? 'Calendar Scheduling' : 'Planner Insights'}
						</h1>
						<p className="text-xs text-slate-500">
							{courses.length} courses · {events.length} tasks · {snapshots.length} snapshots
						</p>
					</div>
					<div className="flex items-center gap-2">
						{syncStatusTag}
						<Tag color={pressureInfo.color}>{pressureInfo.label}</Tag>
						<Button size="small" onClick={restoreSnapshot} disabled={!lastOperationSnapshot}>
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
								<div className="h-full overflow-y-auto p-4">
									<CoursePlanBoard
										courses={courses}
										selectedCourseId={selectedCourseId}
										onSelectCourse={setSelectedCourseId}
									/>
								</div>
							</div>

							<div className="col-span-4 flex h-full flex-col gap-3 overflow-y-auto">
								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-800">Course Profile</h3>
									<p className="mt-2 text-xs text-slate-500">
										{selectedCourseDetail?.courseName || selectedCourseDetail?.name || selectedCourseCode || 'Select a course'}
									</p>
									{selectedCourseDetail?.description ? (
										<p className="mt-2 line-clamp-5 text-xs text-slate-600">{selectedCourseDetail.description}</p>
									) : (
										<p className="mt-2 text-xs text-slate-400">No course description stored.</p>
									)}
								</div>

								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-800">Policy Snapshot</h3>
									{selectedCoursePolicy?.rawPolicyText ? (
										<>
											<p className="mt-2 line-clamp-4 text-xs text-slate-600">{selectedCoursePolicy.rawPolicyText}</p>
											<div className="mt-2 space-y-1 text-xs text-slate-500">
												{selectedCoursePolicy.extensionRule ? <p>Extension: {selectedCoursePolicy.extensionRule}</p> : null}
												{selectedCoursePolicy.integrityRule ? <p>Integrity: {selectedCoursePolicy.integrityRule}</p> : null}
												{selectedCoursePolicy.examAidRule ? <p>Exam aid: {selectedCoursePolicy.examAidRule}</p> : null}
												<p>Parsed rules: {selectedCoursePolicy.rules.length}</p>
											</div>
										</>
									) : (
										<p className="mt-2 text-xs text-slate-400">No policy parsed for current course.</p>
									)}
								</div>

								<SemesterProgress semesterProgress={semesterProgress} events={selectedCourseEvents} />
								<RiskHeatPanel events={selectedCourseEvents} />

								<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-800">Ingestion History</h3>
									<div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
										{snapshots.slice(0, 8).map(item => (
											<div key={item.id} className="rounded border border-slate-100 bg-slate-50 px-2 py-1 text-xs text-slate-600">
												<p className="font-medium">{item.courseCode || 'UNKNOWN'}</p>
												<p>{item.sourceType || 'academic'} · {item.createdAt ? dayjs(item.createdAt).format('MM-DD HH:mm') : '--'}</p>
											</div>
										))}
										{snapshots.length === 0 ? <p className="text-xs text-slate-400">No snapshots yet.</p> : null}
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

			<div className="z-20 h-full w-[420px] border-l border-slate-200 bg-white shadow-2xl">
				<ChatLayoutWrapper />
			</div>

			<Modal
				title={modalMode === 'edit' ? 'Edit Scheduled Task' : 'Create New Academic Task'}
				open={isModalOpen}
				onOk={() => {
					void handleModalOk()
				}}
				onCancel={handleModalClose}
				okText={modalMode === 'edit' ? 'Update Task' : 'Save to Calendar'}
				cancelText="Cancel"
			>
				<div className="space-y-3 py-2">
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-gray-400">Task Name</p>
						<Input
							placeholder="e.g. Study for quiz"
							value={newEventTitle}
							onChange={event => setNewEventTitle(event.target.value)}
							onPressEnter={handleModalOk}
							autoFocus
						/>
					</div>
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-gray-400">Selected Time</p>
						<div className="rounded bg-gray-50 p-2 text-sm text-gray-600">
							{selectedTimeRange?.[0]} {selectedTimeRange?.[1] ? `to ${selectedTimeRange[1]}` : ''}
						</div>
					</div>
					<div className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm text-gray-600">
						<span>All Day Event</span>
						<Switch checked={isAllDayEvent} onChange={setIsAllDayEvent} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<p className="mb-2 text-xs font-bold uppercase text-gray-400">Course</p>
							<Input value={eventCourseCode} onChange={event => setEventCourseCode(event.target.value)} />
						</div>
						<div>
							<p className="mb-2 text-xs font-bold uppercase text-gray-400">Type</p>
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
							<p className="mb-2 text-xs font-bold uppercase text-gray-400">Weight (%)</p>
							<InputNumber
								min={0}
								max={100}
								value={eventWeight}
								onChange={value => setEventWeight(Number(value) || 0)}
								className="w-full"
							/>
						</div>
						<div>
							<p className="mb-2 text-xs font-bold uppercase text-gray-400">Priority</p>
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
					<div>
						<p className="mb-2 text-xs font-bold uppercase text-gray-400">Adjust Date Range</p>
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
								Delete task
							</Button>
						</div>
					) : null}
				</div>
			</Modal>
		</div>
	)
}