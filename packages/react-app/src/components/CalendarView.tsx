'use client'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

// 1. 核心修复：在这里定义 Interface，明确告诉 TS 我们可以接收这两个属性
interface CalendarProps {
  events: any[];
  onEventChange: (updatedEvent: any) => void; 
}

export default function CalendarView({ events, onEventChange }: CalendarProps) {
  return (
    <div className="h-full bg-white p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-600">📅 DDL Strategist Timeline</h2>
      </div>
      <div className="flex-1 border rounded-xl overflow-hidden shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true} // 允许拖拽
          droppable={true}
          // 2. 当事件被拖拽停止时，调用父组件传进来的函数
          eventDrop={(info) => {
            const updated = {
              id: info.event.id,
              title: info.event.title,
              start: info.event.startStr, // 获取拖拽后的新日期
            };
            onEventChange(updated);
          }}
          height="100%"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
        />
      </div>
    </div>
  )
}