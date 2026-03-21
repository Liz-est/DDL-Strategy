'use client'
import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

interface CalendarProps {
  events: any[];
  onEventChange: (updatedEvent: any) => void;
}

export default function CalendarView({ events, onEventChange }: CalendarProps) {
  
  // 自定义事件渲染：根据权重和类型显示不同的样式 (Proposal 4.2 需求)
  const renderEventContent = (eventInfo: any) => {
    const { weight, type } = eventInfo.event.extendedProps;
    const isHighRisk = weight >= 30 || type === 'Exam';

    return (
      <div className={`
        flex flex-col px-2 py-1 rounded-md border-l-4 shadow-sm transition-all hover:brightness-95
        ${isHighRisk 
          ? 'bg-red-50 border-red-500 text-red-700' 
          : 'bg-indigo-50 border-indigo-500 text-indigo-700'}
      `}>
        <div className="flex justify-between items-center overflow-hidden">
          <span className="text-[9px] font-bold uppercase truncate opacity-80">
            {type || 'Assignment'}
          </span>
          {isHighRisk && <span className="text-[10px]">🔥</span>}
        </div>
        <div className="text-xs font-bold truncate leading-tight">
          {eventInfo.event.title}
        </div>
        {weight && (
          <div className="text-[9px] mt-0.5 font-medium opacity-60">
            Weight: {weight}%
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 注入 CSS 覆盖 FullCalendar 默认样式，使其更美观 */}
      <style>{`
        .fc { --fc-border-color: #e2e8f0; --fc-button-bg-color: #4f46e5; --fc-button-border-color: #4f46e5; --fc-button-hover-bg-color: #4338ca; }
        .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
        .fc .fc-col-header-cell-cushion { padding: 8px 0; font-size: 0.875rem; color: #64748b; text-transform: uppercase; }
        .fc .fc-daygrid-day-number { font-size: 0.875rem; color: #94a3b8; padding: 8px; }
        .fc .fc-day-today { background-color: #f8fafc !important; }
        .fc-theme-standard .fc-scrollgrid { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .fc-event { background: transparent !important; border: none !important; margin: 2px 4px !important; }
      `}</style>

      <div className="flex-1 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          editable={true}
          droppable={true}
          eventContent={renderEventContent} // 👈 使用自定义美化渲染
          
          // 移除 alert，改用控制台记录
           eventClick={(info) => {
            const { weight, type, estimated_hours, rationale } = info.event.extendedProps;
            
            // 3. 将 alert 替换为控制台打印，或在 UI 侧边栏显示详情
            console.log('Task Details:', {
              title: info.event.title,
              type,
              weight,
              estimated_hours,
              rationale
            });

            // 💡 演示小技巧：如果想给教授看，可以在控制台直接打出一段漂亮的文字
            console.info(`%c 📋 [${type}] ${info.event.title} `, 'background: #3b82f6; color: white; font-weight: bold;');
            console.info(`Estimated Workload: ${estimated_hours}h | Rationale: ${rationale}`);
          }}
          
          eventDrop={(info) => {
            const updated = {
              id: info.event.id,
              title: info.event.title,
              start: info.event.startStr,
            };
            onEventChange(updated);
          }}
          
          height="100%"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
          }}
          dayMaxEvents={true}
        />
      </div>
    </div>
  )
}