"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { Button, DatePicker, Input, InputNumber, Modal, Select, Tag, message } from 'antd'
import type { DateSelectArg } from '@fullcalendar/core'
import CalendarView from '@/components/CalendarView'
import CoursePlanBoard from '@/components/planner/CoursePlanBoard'
import RiskHeatPanel from '@/components/planner/RiskHeatPanel'
import SemesterProgress from '@/components/planner/SemesterProgress'
import config from '@/config/runtime-config'
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

const DEFAULT_USER_ID = 'cmm9gaoo2000101nu78lnxx2v'
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
		setCourses,
		setSyncStatus,
		saveSnapshot,
		restoreSnapshot,
	} = useAcademicPlannerStore()
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [newEventTitle, setNewEventTitle] = useState('')
	const [selectedTimeRange, setSelectedTimeRange] = useState<[string, string | undefined] | null>(null)
	const [eventCourseCode, setEventCourseCode] = useState('MANUAL')
	const [eventType, setEventType] = useState('Task')
	const [eventWeight, setEventWeight] = useState(0)
	const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
	const [hasInitialized, setHasInitialized] = useState(false)
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const observeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const lastPayloadFingerprint = useRef<string>('')

	const pressureInfo = useMemo(() => {
		const totalWeight = events.reduce((acc, curr) => acc + (curr.weight || 0), 0)
		if (totalWeight > 50) return { label: 'High Risk', color: 'red' }
		return { label: 'Balanced', color: 'green' }
	}, [events])

	useEffect(() => {
		let active = true
		const hydrate = async () => {
			setSyncStatus('syncing')
			try {
				const { events: remoteEvents } = await loadAcademicSnapshots({
					apiBase,
					userId: DEFAULT_USER_ID,
				})
				if (!active) return
				const merged = mergeUniqueEvents(events, remoteEvents)
				const finalEvents = merged.length > 0 ? merged : events
				setEvents(finalEvents)
				setCourses(buildCoursePlans(finalEvents))
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
						setCourses(buildCoursePlans(parsed))
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
	}, [apiBase, events, setCourses, setEvents, setSemesterProgress, setSyncStatus])

	useEffect(() => {
		setCourses(buildCoursePlans(events))
		setSemesterProgress(getSemesterProgress(events))
	}, [events, setCourses, setSemesterProgress])

	useEffect(() => {
		if (!hasInitialized) return
		if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
		syncTimerRef.current = setTimeout(() => {
			const grouped = events.reduce<Record<string, AcademicEvent[]>>((acc, item) => {
				const key = item.courseCode || 'GENERAL'
				acc[key] = acc[key] || []
				acc[key].push(item)
				return acc
			}, {})
			void (async () => {
				try {
					setSyncStatus('syncing')
					await Promise.all(
						Object.entries(grouped).map(([courseCode, courseEvents]) =>
							syncAcademicTasks({
								apiBase,
								userId: DEFAULT_USER_ID,
								courseCode,
								events: courseEvents,
							})
						)
					)
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
	}, [apiBase, events, hasInitialized, setSyncStatus])

	useEffect(() => {
		const observer = new MutationObserver(() => {
			if (observeTimerRef.current) clearTimeout(observeTimerRef.current)
			observeTimerRef.current = setTimeout(() => {
				const content = document.body?.innerText || ''
				const payload = extractAcademicPayloadFromText(content)
				if (!payload) return

				const fingerprint = `${payload.courseCode}-${payload.taskList.length}-${payload.taskList[0]?.name || ''}`
				if (fingerprint === lastPayloadFingerprint.current) return
				lastPayloadFingerprint.current = fingerprint

				const newEvents = payload.taskList.map((task, index) =>
					mapTaskToEvent(task, payload.courseCode, index)
				)
				const merged = mergeUniqueEvents(useAcademicPlannerStore.getState().events, newEvents)
				if (merged.length === useAcademicPlannerStore.getState().events.length) return

				setEvents(merged)
				setCourses(buildCoursePlans(merged))
				void saveJsonToDatabase({
					apiBase,
					userId: DEFAULT_USER_ID,
					courseCode: payload.courseCode,
					jsonData: payload.parsed,
					description: `Extracted ${newEvents.length} tasks`,
				})
				if (payload.gradingPolicy) {
					void saveCoursePolicies({
						apiBase,
						userId: DEFAULT_USER_ID,
						courseCode: payload.courseCode,
						gradingPolicy: payload.gradingPolicy,
					})
				}
				message.success(`Imported ${newEvents.length} tasks from AI result`)
			}, 900)
		})

		const target = document.body || document.documentElement
		observer.observe(target, { childList: true, subtree: true })

		return () => {
			observer.disconnect()
			if (observeTimerRef.current) clearTimeout(observeTimerRef.current)
		}
	}, [apiBase, setCourses, setEvents])

	const handleDateSelect = (selectInfo: DateSelectArg) => {
		setSelectedTimeRange([selectInfo.startStr, selectInfo.endStr])
		setEventCourseCode('MANUAL')
		setEventType('Task')
		setEventWeight(0)
		setPriority('medium')
		setNewEventTitle('')
		setIsModalOpen(true)
	}

	const handleModalOk = () => {
		if (!newEventTitle.trim()) {
			message.warning('Please enter a task name')
			return
		}
		if (!selectedTimeRange?.[0]) {
			message.warning('Please choose a valid date range')
			return
		}
		const [start, end] = selectedTimeRange
		const highRisk = eventType === 'Exam' || eventWeight >= 30
		const newEvent: AcademicEvent = {
			id: `user-${Date.now()}`,
			title: newEventTitle.trim(),
			start,
			end,
			allDay: true,
			color: highRisk ? '#ef4444' : '#8b5cf6',
			weight: eventWeight,
			type: eventType,
			courseCode: eventCourseCode,
			priority,
			extendedProps: { source: 'manual' },
		}
		saveSnapshot()
		upsertEvent(newEvent)
		setIsModalOpen(false)
		message.success('Task added to calendar')
	}

	const handleCalendarEventChange = async (updatedEvent: {
		id: string
		title: string
		start: string
		end?: string
		allDay?: boolean
	}) => {
		const snapshot = useAcademicPlannerStore.getState().events
		const nextEvents = snapshot.map(item =>
			item.id === updatedEvent.id
				? { ...item, start: updatedEvent.start, end: updatedEvent.end, allDay: updatedEvent.allDay }
				: item
		)
		setEvents(nextEvents)

		const changed = nextEvents.find(item => item.id === updatedEvent.id)
		if (!changed) return false

		try {
			setSyncStatus('syncing')
			await syncAcademicTasks({
				apiBase,
				userId: DEFAULT_USER_ID,
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

	return (
		<div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9]">
			<div className="flex h-full w-16 flex-col items-center gap-8 bg-[#1e293b] py-6 text-white/60">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
					DS
				</div>
				<button
					type="button"
					className={`h-9 w-9 rounded-lg text-xs font-semibold transition ${
						uiMode === 'calendar' ? 'bg-white text-slate-800' : 'bg-slate-700 text-white'
					}`}
					onClick={() => setUiMode('calendar')}
					aria-pressed={uiMode === 'calendar'}
					title="Calendar Mode"
				>
					CAL
				</button>
				<button
					type="button"
					className={`h-9 w-9 rounded-lg text-xs font-semibold transition ${
						uiMode === 'planner' ? 'bg-white text-slate-800' : 'bg-slate-700 text-white'
					}`}
					onClick={() => setUiMode('planner')}
					aria-pressed={uiMode === 'planner'}
					title="Planner Mode"
				>
					PLAN
				</button>
			</div>

			<div className="flex h-full min-w-0 flex-1 flex-col">
				<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
					<div>
						<h1 className="text-lg font-bold text-slate-800">Academic Strategist</h1>
						<p className="text-xs text-slate-500">
							{uiMode === 'calendar' ? 'Calendar Scheduling View' : 'Course Planning View'}
						</p>
					</div>
					<div className="flex items-center gap-3">
						{syncStatusTag}
						<Tag color={pressureInfo.color}>{pressureInfo.label}</Tag>
						<Button size="small" onClick={restoreSnapshot} disabled={!lastOperationSnapshot}>
							Undo
						</Button>
					</div>
				</header>

				<main className="flex-1 overflow-hidden p-6">
					<div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
						{uiMode === 'calendar' ? (
							<CalendarView
								events={events}
								currentView={calendarViewType}
								onViewChange={setCalendarViewType}
								onEventChange={handleCalendarEventChange}
								onDateSelect={handleDateSelect}
							/>
						) : (
							<div className="grid h-full grid-cols-5 gap-4 p-4">
								<div className="col-span-3 overflow-y-auto rounded-xl border bg-slate-50 p-4">
									<CoursePlanBoard
										courses={courses}
										selectedCourseId={selectedCourseId}
										onSelectCourse={setSelectedCourseId}
									/>
								</div>
								<div className="col-span-2 flex flex-col gap-4 overflow-y-auto">
									<SemesterProgress semesterProgress={semesterProgress} events={selectedCourseEvents} />
									<RiskHeatPanel events={selectedCourseEvents} />
									{syncStatus === 'error' && lastSyncError ? (
										<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
											Sync error: {lastSyncError}
										</div>
									) : null}
								</div>
							</div>
						)}
					</div>
				</main>
			</div>

			<div className="z-20 h-full w-[420px] border-l border-slate-200 bg-white shadow-2xl">
				<ChatLayoutWrapper />
			</div>

			<Modal
				title="Create New Academic Task"
				open={isModalOpen}
				onOk={handleModalOk}
				onCancel={() => setIsModalOpen(false)}
				okText="Save to Calendar"
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
									value[0].format('YYYY-MM-DD'),
									value[1] ? value[1].format('YYYY-MM-DD') : undefined,
								])
							}}
						/>
					</div>
				</div>
			</Modal>
		</div>
	)
}