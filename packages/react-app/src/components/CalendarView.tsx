'use client'
import React, { useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import listPlugin from '@fullcalendar/list'

interface CalendarProps {
  events: any[];
  onEventChange: (updatedEvent: any) => void;
  onDateSelect: (selectInfo: any) => void; // 👈 新增：处理用户手动选择日期创建日程
}

export default function CalendarView({ events, onEventChange, onDateSelect }: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null!);

  // 视图切换函数
  const changeView = (viewName: string) => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView(viewName);
  };

  const renderEventContent = (eventInfo: any) => {
    const { weight, type } = eventInfo.event.extendedProps;
    const isHighRisk = weight >= 30 || type === 'Exam';
    return (
      <div className={`flex flex-col px-1 py-0.5 rounded border-l-2 shadow-sm truncate ${
        isHighRisk ? 'bg-red-50 border-red-500 text-red-700' : 'bg-blue-50 border-blue-500 text-blue-700'
      }`}>
        <div className="font-bold text-[9px] truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* --- 自定义顶部导航栏 (模仿手机日历) --- */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50/50">
        <div className="flex bg-white border rounded-lg p-1 shadow-sm">
          {[
            { label: '年', view: 'multiMonthYear' },
            { label: '月', view: 'dayGridMonth' },
            { label: '周', view: 'timeGridWeek' },
            { label: '日', view: 'timeGridDay' },
            { label: '日程', view: 'listMonth' },
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => changeView(item.view)}
              className="px-4 py-1 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-all active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => calendarRef.current.getApi().prev()} className="p-2 hover:bg-gray-200 rounded-full">往前</button>
          <button onClick={() => calendarRef.current.getApi().today()} className="px-4 py-1 bg-indigo-600 text-white rounded-md text-sm font-bold shadow-md shadow-indigo-200">今天</button>
          <button onClick={() => calendarRef.current.getApi().next()} className="p-2 hover:bg-gray-200 rounded-full">往后</button>
        </div>
      </div>

      {/* --- 日历主体 --- */}
      <div className="flex-1 p-4 overflow-hidden">
        <style>{`
          .fc { font-family: inherit; --fc-border-color: #f1f5f9; --fc-today-bg-color: #f8fafc; }
          .fc-header-toolbar { display: none !important; } /* 隐藏自带标题栏 */
          .fc .fc-col-header-cell-cushion { padding: 12px 0; color: #64748b; font-size: 0.8rem; }
          .fc-multimonth { background: white; }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin, listPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true}
          selectable={true}    // 👈 核心：允许点击/拖拽空白处
          selectMirror={true}
          dayMaxEvents={true}
          height="100%"
          
          // 当用户点击并拖拽选择一个时段时
          select={(info) => {
            onDateSelect(info);
            calendarRef.current.getApi().unselect(); // 选择完成后取消高亮
          }}
          
          eventContent={renderEventContent}
          eventDrop={(info) => {
            onEventChange({ id: info.event.id, title: info.event.title, start: info.event.startStr });
          }}
        />
      </div>
    </div>
  )
}