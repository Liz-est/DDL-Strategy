'use client'
import React, { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import type { DateSelectArg, DatesSetArg, EventContentArg, EventDropArg, EventResizeDoneArg } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list'
import type { AcademicEvent, CalendarViewType } from '@/store/academic-planner'

interface CalendarProps {
	events: AcademicEvent[]
	currentView: CalendarViewType
	onViewChange: (view: CalendarViewType) => void
	onEventChange: (updatedEvent: {
		id: string
		title: string
		start: string
		end?: string
		allDay?: boolean
	}) => Promise<boolean> | boolean
	onDateSelect: (selectInfo: DateSelectArg) => void
}

const VIEW_OPTIONS: { label: string; view: CalendarViewType }[] = [
	{ label: '年', view: 'multiMonthYear' },
	{ label: '月', view: 'dayGridMonth' },
	{ label: '周', view: 'timeGridWeek' },
	{ label: '日', view: 'timeGridDay' },
	{ label: '日程', view: 'listWeek' },
]

export default function CalendarView({
	events,
	currentView,
	onViewChange,
	onEventChange,
	onDateSelect,
}: CalendarProps) {
	const calendarRef = useRef<FullCalendar>(null)
	const [activeView, setActiveView] = useState<CalendarViewType>(currentView)

	useEffect(() => {
		const calendarApi = calendarRef.current?.getApi()
		if (calendarApi && calendarApi.view.type !== currentView) {
			calendarApi.changeView(currentView)
		}
		setActiveView(currentView)
	}, [currentView])

	const changeView = (viewName: CalendarViewType) => {
		const calendarApi = calendarRef.current?.getApi()
		if (!calendarApi) return
		calendarApi.changeView(viewName)
		setActiveView(viewName)
		onViewChange(viewName)
	}

	const renderEventContent = (eventInfo: EventContentArg) => {
		const { weight, type } = eventInfo.event.extendedProps || {}
		const isHighRisk = Number(weight) >= 30 || type === 'Exam'
		return (
			<div
				className={`flex flex-col truncate rounded border-l-2 px-1 py-0.5 shadow-sm transition-colors ${
					isHighRisk ? 'border-red-500 bg-red-50 text-red-700' : 'border-blue-500 bg-blue-50 text-blue-700'
				}`}
			>
				<div className="truncate text-[9px] font-bold">{eventInfo.event.title}</div>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col bg-white">
			<div className="flex items-center justify-between border-b bg-gray-50/50 px-6 py-3">
				<div className="flex rounded-lg border bg-white p-1 shadow-sm">
					{VIEW_OPTIONS.map(item => (
						<button
							key={item.view}
							onClick={() => changeView(item.view)}
							className={`rounded-md px-4 py-1 text-sm font-medium transition-all active:scale-95 ${
								activeView === item.view
									? 'bg-indigo-600 text-white shadow-sm'
									: 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => calendarRef.current?.getApi().prev()}
						className="rounded-full p-2 hover:bg-gray-200"
					>
						往前
					</button>
					<button
						onClick={() => calendarRef.current?.getApi().today()}
						className="rounded-md bg-indigo-600 px-4 py-1 text-sm font-bold text-white shadow-md shadow-indigo-200"
					>
						今天
					</button>
					<button
						onClick={() => calendarRef.current?.getApi().next()}
						className="rounded-full p-2 hover:bg-gray-200"
					>
						往后
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-hidden p-4">
				<style>{`
          .fc { font-family: inherit; --fc-border-color: #f1f5f9; --fc-today-bg-color: #f8fafc; }
          .fc-header-toolbar { display: none !important; } /* 隐藏自带标题栏 */
          .fc .fc-col-header-cell-cushion { padding: 12px 0; color: #64748b; font-size: 0.8rem; }
          .fc-multimonth { background: white; }
        `}</style>
				<FullCalendar
					ref={calendarRef}
					plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin, listPlugin]}
					initialView={currentView}
					events={events}
					editable
					selectable
					selectMirror
					dayMaxEvents
					height="100%"
					select={(info: DateSelectArg) => {
						onDateSelect(info)
						calendarRef.current?.getApi().unselect()
					}}
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
						onViewChange(view)
					}}
				/>
			</div>
		</div>
	)
}