'use client'
import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import type {
	DateClickArg,
	DateSelectArg,
	DatesSetArg,
	EventClickArg,
	EventContentArg,
	EventDropArg,
	EventResizeDoneArg,
} from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list'
import { getNextCalendarViewForDrill } from '@/lib/calendar-drilldown'
import type { AcademicEvent, CalendarViewType } from '@/store/academic-planner'

interface CalendarProps {
	events: AcademicEvent[]
	currentView: CalendarViewType
	onViewChange: (view: CalendarViewType) => void
	onEventClick: (eventId: string) => void
	onEventChange: (updatedEvent: {
		id: string
		title: string
		start: string
		end?: string
		allDay?: boolean
	}) => Promise<boolean> | boolean
	onDateSelect: (selectInfo: DateSelectArg) => void
	onQuickAdd: () => void
}

const VIEW_OPTIONS: { label: string; view: CalendarViewType }[] = [
	{ label: 'Year', view: 'multiMonthYear' },
	{ label: 'Month', view: 'dayGridMonth' },
	{ label: 'Week', view: 'timeGridWeek' },
	{ label: 'Day', view: 'timeGridDay' },
	{ label: 'Agenda', view: 'listWeek' },
]

export default function CalendarView({
	events,
	currentView,
	onViewChange,
	onEventClick,
	onEventChange,
	onDateSelect,
	onQuickAdd,
}: CalendarProps) {
	const calendarRef = useRef<FullCalendar>(null)
	const [activeView, setActiveView] = useState<CalendarViewType>(currentView)
	const [currentTitle, setCurrentTitle] = useState('')

	useEffect(() => {
		const calendarApi = calendarRef.current?.getApi()
		if (calendarApi && calendarApi.view.type !== currentView) {
			calendarApi.changeView(currentView)
		}
		setActiveView(currentView)
		setCurrentTitle(calendarApi?.view.title || '')
	}, [currentView])

	const changeView = (viewName: CalendarViewType) => {
		const calendarApi = calendarRef.current?.getApi()
		if (!calendarApi) return
		calendarApi.changeView(viewName)
		setActiveView(viewName)
		onViewChange(viewName)
	}

	const renderEventContent = (eventInfo: EventContentArg) => {
		const { weight, type, courseName, taskCategory } = eventInfo.event.extendedProps || {}
		const isChore = taskCategory === 'chores'
		const isHighRisk = !isChore && (Number(weight) >= 30 || type === 'Exam')
		return (
			<div
				className={`flex min-w-0 flex-col truncate rounded border-l-[3px] px-1 py-0.5 shadow-sm transition-colors ${
					isHighRisk
						? 'border-l-pink-300 bg-pink-50 text-pink-900'
						: 'border-l-emerald-300 bg-emerald-50 text-emerald-900'
				}`}
			>
				<div className="truncate text-[10px] font-bold">{eventInfo.event.title}</div>
				{!eventInfo.event.allDay ? <div className="truncate text-[9px] opacity-90">{eventInfo.timeText}</div> : null}
				{courseName ? <div className="truncate text-[8px] opacity-90">{courseName}</div> : null}
				{isChore ? <div className="truncate text-[8px] opacity-90">Personal</div> : null}
				{isHighRisk ? <div className="mt-0.5 text-[8px] font-semibold text-pink-800">High impact</div> : null}
			</div>
		)
	}

	const jumpTo = (direction: 'prev' | 'next' | 'today') => {
		const calendarApi = calendarRef.current?.getApi()
		if (!calendarApi) return
		if (direction === 'prev') calendarApi.prev()
		if (direction === 'today') calendarApi.today()
		if (direction === 'next') calendarApi.next()
		setCurrentTitle(calendarApi.view.title)
	}

	return (
		<div className="calendar-shell flex h-full flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
			<div className="flex items-center justify-between border-b border-slate-200/70 bg-white/92 px-6 py-4 backdrop-blur">
				<div className="space-y-1">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Calendar</p>
					<h2 className="text-lg font-semibold text-slate-900">{currentTitle || 'Schedule'}</h2>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => jumpTo('prev')}
						className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
					>
						Prev
					</button>
					<button
						type="button"
						onClick={() => jumpTo('today')}
						className="rounded-xl bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-950 shadow-sm ring-1 ring-indigo-200/90 transition hover:bg-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
					>
						Today
					</button>
					<button
						type="button"
						onClick={() => jumpTo('next')}
						className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
					>
						Next
					</button>
					<button
						type="button"
						onClick={onQuickAdd}
						className="ml-2 rounded-xl bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-950 shadow-sm ring-1 ring-emerald-200/90 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
					>
						New task
					</button>
				</div>
			</div>

			<div className="border-b border-slate-200/70 bg-white/80 px-6 py-2">
				<div className="inline-flex rounded-xl bg-slate-100/80 p-1 ring-1 ring-slate-200/80">
					{VIEW_OPTIONS.map(item => (
						<button
							key={item.view}
							onClick={() => changeView(item.view)}
							type="button"
							className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
								activeView === item.view
									? 'bg-indigo-100 text-indigo-950 shadow-sm ring-1 ring-indigo-200/80'
									: 'text-slate-800 hover:bg-slate-200/80'
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="calendar-panel flex-1 overflow-hidden px-4 pb-4 pt-3">
				<style>{`
          .calendar-shell .fc {
            font-family: inherit;
            --fc-border-color: #e2e8f0;
            --fc-today-bg-color: #eff6ff;
            --fc-list-event-hover-bg-color: #f8fafc;
            --fc-neutral-bg-color: #f8fafc;
            --fc-page-bg-color: transparent;
          }
          .calendar-shell button {
            border: none;
          }
          .calendar-shell .fc-header-toolbar {
            display: none !important;
          }
          .calendar-shell .fc .fc-col-header-cell-cushion {
            padding: 10px 0;
            color: #64748b;
            font-size: 0.76rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .calendar-shell .fc .fc-daygrid-day-frame,
          .calendar-shell .fc .fc-timegrid-slot {
            background: #ffffff;
          }
          .calendar-shell .fc .fc-daygrid-day.fc-day-today,
          .calendar-shell .fc .fc-timegrid-col.fc-day-today {
            background: #eff6ff;
          }
          .calendar-shell .fc .fc-event {
            border: 0;
            background: transparent;
            cursor: pointer;
          }
          .calendar-shell .fc a:focus:not(:focus-visible),
          .calendar-shell .fc button:focus:not(:focus-visible) {
            outline: none;
            box-shadow: none;
          }
          .calendar-shell .fc a:focus-visible,
          .calendar-shell .fc button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.45);
            border-radius: 4px;
          }
          .calendar-shell .fc .fc-list-event-dot {
            border-color: #6366f1;
          }
          .calendar-shell .fc .fc-list-event-title a,
          .calendar-shell .fc .fc-list-event-time {
            color: #334155;
          }
          .calendar-panel .fc-scroller,
          .calendar-panel .fc-scroller-liquid-absolute {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .calendar-panel .fc-scroller::-webkit-scrollbar,
          .calendar-panel .fc-scroller-liquid-absolute::-webkit-scrollbar {
            display: none;
          }
          .calendar-shell .fc-theme-standard td,
          .calendar-shell .fc-theme-standard th {
            border-color: #e2e8f0;
          }
        `}</style>
				<FullCalendar
					ref={calendarRef}
					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin, listPlugin]}
					initialView={currentView}
					events={events}
					editable
					selectable={activeView === 'timeGridWeek' || activeView === 'timeGridDay'}
					selectMirror
					dayMaxEvents
					nowIndicator
					allDaySlot
					slotDuration="00:30:00"
					snapDuration="00:15:00"
					eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
					scrollTime="08:00:00"
					height="100%"
					buttonText={{
						today: 'Today',
						month: 'Month',
						week: 'Week',
						day: 'Day',
						list: 'Agenda',
					}}
					select={(info: DateSelectArg) => {
						onDateSelect(info)
						calendarRef.current?.getApi().unselect()
					}}
					dateClick={(info: DateClickArg) => {
						const api = calendarRef.current?.getApi()
						if (!api) return
						const viewType = info.view.type as CalendarViewType
						const nextView = getNextCalendarViewForDrill(viewType)
						if (nextView) {
							api.changeView(nextView, info.date)
							setActiveView(nextView)
							onViewChange(nextView)
						}
					}}
					eventClick={(info: EventClickArg) => onEventClick(info.event.id)}
					eventContent={renderEventContent}
					eventDrop={async (info: EventDropArg) => {
						const accepted = await onEventChange({
							id: info.event.id,
							title: info.event.title,
							start: info.event.startStr,
							end: info.event.endStr ?? undefined,
							allDay: info.event.allDay,
						})
						if (!accepted) info.revert()
					}}
					eventResize={async (info: EventResizeDoneArg) => {
						const accepted = await onEventChange({
							id: info.event.id,
							title: info.event.title,
							start: info.event.startStr,
							end: info.event.endStr ?? undefined,
							allDay: info.event.allDay,
						})
						if (!accepted) info.revert()
					}}
					datesSet={(dateInfo: DatesSetArg) => {
						const view = dateInfo.view.type as CalendarViewType
						setActiveView(view)
						setCurrentTitle(dateInfo.view.title)
						onViewChange(view)
					}}
				/>
			</div>
		</div>
	)
}