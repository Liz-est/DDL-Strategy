'use client'
import { useState, useEffect, useMemo } from 'react'
import { Modal, Input, message } from 'antd' // 👈 引入真实的 UI 组件
import ChatLayoutWrapper from '@/layout/chat-layout-wrapper'
import CalendarView from '@/components/CalendarView'

interface AcademicEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  weight?: number;
  type?: string;
  extendedProps?: any;
}

export default function ChatPage() {
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([
    { id: '1', title: 'AIE1902: Project Start', start: '2026-03-10', color: '#3b82f6', weight: 10, type: 'Project' }
  ])

  // --- 状态管理：用于控制新建日程的弹窗 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [currentSelection, setCurrentSelection] = useState<any>(null);

  // 1. 处理日历点击选择：打开真实弹窗
  const handleDateSelect = (selectInfo: any) => {
    setCurrentSelection(selectInfo);
    setIsModalOpen(true); // 打开弹窗
  };

  // 2. 弹窗确认按钮：真正创建日程
  const handleModalOk = () => {
    if (!newEventTitle.trim()) {
      message.warning('Please enter a task name');
      return;
    }

    const newEvent: AcademicEvent = {
      id: `user-${Date.now()}`,
      title: newEventTitle,
      start: currentSelection.startStr,
      end: currentSelection.endStr,
      allDay: currentSelection.allDay,
      color: '#8b5cf6', // 手动创建的用紫色区分
      extendedProps: {
        type: 'Manual',
        weight: 0
      }
    };

    setAcademicEvents(prev => [...prev, newEvent]);
    setIsModalOpen(false);
    setNewEventTitle('');
    message.success('Task added to calendar');
  };

  // 之前的逻辑保持不变 (handleRePlan, useEffect 等)
  const handleRePlan = (updatedEvent: any) => {
    setAcademicEvents(prev => 
      prev.map(ev => ev.id === updatedEvent.id ? { ...ev, start: updatedEvent.start } : ev)
    );
  };

  const pressureInfo = useMemo(() => {
    const totalWeight = academicEvents.reduce((acc, curr) => acc + (curr.weight || 0), 0);
    if (totalWeight > 50) return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-100' };
    return { label: 'Balanced', color: 'text-green-500', bg: 'bg-green-100' };
  }, [academicEvents]);

  useEffect(() => {
    console.log("战略家：实时监听器已启动...");

    const handler = (text: string) => {
      // 1. 这里的正则可以抓取 [ ... ] 形式的任务列表
      const jsonRegex = /\[[\s\S]*?due_date_raw[\s\S]*?\]/;
      const match = text.match(jsonRegex);

      if (match) {
        try {
          console.log("战略家：检测到潜在 JSON 数据，开始解析...");
          const rawJson = match[0].replace(/```json|```/g, "");
          const taskList = JSON.parse(rawJson);
          
          if (Array.isArray(taskList) && taskList.length > 0) {
            const newEvents = taskList.map((item: any, index: number) => ({
              id: `ai-${item.name}-${index}`,
              title: item.name || "Unnamed Task",
              start: item.due_date_raw, // 使用 AI 返回的 YYYY-MM-DD
              weight: item.weight || 0,
              type: item.task_type_standardized || item.type,
              extendedProps: {
                weight: item.weight,
                type: item.task_type_standardized || item.type,
                estimated_hours: item.estimated_hours,
                rationale: item.rationale
              },
              color: (item.type === 'Exam' || item.weight >= 30) ? '#ef4444' : '#10b981'
            }));

            setAcademicEvents(prev => {
              const existingTitles = new Set(prev.map(ev => ev.title));
              const uniqueNew = newEvents.filter((ev: any) => !existingTitles.has(ev.title));
              if (uniqueNew.length > 0) {
                console.log(`战略家：成功同步 ${uniqueNew.length} 个新任务到日历！`);
              }
              return [...prev, ...uniqueNew];
            });
          }
        } catch {
          // 这里的报错通常是因为 JSON 还在流式输出中，尚未闭合，属于正常现象
        }
      }
    };

    // 方案 A: 监听自定义事件 (如果你已经按照之前的步骤改了底层代码)
    const eventHandler = (e: any) => handler(e.detail);
    window.addEventListener('dify-data-update', eventHandler);
    window.addEventListener('dify-api-response', eventHandler);

    // 方案 B: DOM 深度观察者 (针对工作流结果页面的暴力抓取)
    const observer = new MutationObserver(() => {
      // 这里的 .chat-message-content 是消息容器的常见类名，针对你的界面进行调整
      const content = document.body.innerText; 
      handler(content);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('dify-data-update', eventHandler);
      window.removeEventListener('dify-api-response', eventHandler);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9]">
      {/* 侧边栏和布局保持不变 */}
      <div className="w-16 h-full bg-[#1e293b] flex flex-col items-center py-6 gap-8 text-white/50">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">DS</div>
        <div className="text-white cursor-pointer">📅</div>
      </div>

      <div className="flex-1 h-full flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Academic Strategist</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold ${pressureInfo.color}`}>{pressureInfo.label}</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <CalendarView 
              events={academicEvents} 
              onEventChange={handleRePlan}
              onDateSelect={handleDateSelect} // 👈 传递处理函数
            />
          </div>
        </main>
      </div>

      <div className="w-[420px] h-full bg-white border-l border-slate-200 shadow-2xl z-20">
        <ChatLayoutWrapper />
      </div>

      {/* --- 真实的产品交互：新建日程弹窗 --- */}
      <Modal
        title="Create New Academic Task"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText="Save to Calendar"
        cancelText="Cancel"
      >
        <div className="py-4">
          <p className="text-xs text-gray-400 mb-2 uppercase font-bold">Task Name</p>
          <Input 
            placeholder="e.g. Study for Quiz, Lab Work..." 
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            onPressEnter={handleModalOk}
            autoFocus
          />
          <p className="mt-4 text-xs text-gray-400 uppercase font-bold">Selected Time</p>
          <div className="bg-gray-50 p-2 rounded text-sm text-gray-600">
            {currentSelection?.startStr} {currentSelection?.endStr ? ` to ${currentSelection.endStr}` : ''}
          </div>
        </div>
      </Modal>
    </div>
  )
}