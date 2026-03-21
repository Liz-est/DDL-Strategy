'use client'
import { useState, useEffect, useMemo } from 'react' // 删掉了多余的 React
import ChatLayoutWrapper from '@/layout/chat-layout-wrapper'
import CalendarView from '@/components/CalendarView'

interface AcademicEvent {
  id: string;
  title: string;
  start: string;
  color?: string;
  weight?: number;
  type?: string;
  extendedProps?: any; // 允许存储额外信息
}

export default function ChatPage() {
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([
    { id: '1', title: 'Demo: Project Start', start: '2026-03-10', color: '#3b82f6', weight: 10, type: 'Project' }
  ])

  const pressureInfo = useMemo(() => {
    const totalWeight = academicEvents.reduce((acc, curr) => acc + (curr.weight || 0), 0);
    if (totalWeight > 50) return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-100' };
    if (totalWeight > 20) return { label: 'Moderate', color: 'text-orange-500', bg: 'bg-orange-100' };
    return { label: 'Balanced', color: 'text-green-500', bg: 'bg-green-100' };
  }, [academicEvents]);

  // 1. 定义 handleRePlan，解决“找不到名称”报错
  const handleRePlan = (updatedEvent: any) => {
    console.log('Task Rescheduled:', updatedEvent);
    setAcademicEvents(prev => 
      prev.map(ev => ev.id === updatedEvent.id ? { ...ev, start: updatedEvent.start } : ev)
    );
  };

  useEffect(() => {
    const handler = (e: any) => {
      const text = e.detail;
      const jsonMatch = text.match(/(\[[\s\S]*?due_date_raw[\s\S]*?\]|\{[\s\S]*?assessments[\s\S]*?\})/);

      if (jsonMatch) {
        try {
          const rawJson = jsonMatch[0].replace(/```json|```/g, "");
          const parsed = JSON.parse(rawJson);
          const taskList = Array.isArray(parsed) ? parsed : (parsed.assessments || []);
          
          if (taskList.length > 0) {
            const newEvents = taskList.map((item: any, index: number) => ({
              id: `ai-${item.name}-${index}`,
              title: item.name || "Unnamed Task",
              start: item.due_date_raw || new Date().toISOString().split('T')[0],
              weight: item.weight || 0,
              type: item.type || 'Task',
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
              return [...prev, ...uniqueNew];
            });
          }
        } catch { // 2. 删掉 err 变量，解决“caught but never used”报错
          // 静默等待 JSON 生成完整
        }
      }
    };

    window.addEventListener('dify-data-update', handler);
    window.addEventListener('dify-api-response', handler);
    return () => {
      window.removeEventListener('dify-data-update', handler);
      window.removeEventListener('dify-api-response', handler);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9]">
      {/* 侧边栏 */}
      <div className="w-16 h-full bg-[#1e293b] flex flex-col items-center py-6 gap-8 text-white/50">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">DS</div>
        <div className="flex flex-col gap-6 text-xl">
          <div className="text-white cursor-pointer transition-colors">📅</div>
        </div>
      </div>

      {/* 主面板 */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Academic Strategist</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">AIE1902 Project Hub</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Workload Status</span>
              <span className={`text-sm font-black ${pressureInfo.color}`}>{pressureInfo.label}</span>
            </div>
            <div className={`w-8 h-8 ${pressureInfo.bg} rounded-full flex items-center justify-center`}>
              <span className={`text-xs animate-pulse ${pressureInfo.color}`}>●</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <CalendarView 
              events={academicEvents} 
              onEventChange={handleRePlan} 
            />
          </div>
        </main>
      </div>

      <div className="w-[420px] h-full bg-white border-l border-slate-200 shadow-2xl z-20">
        <ChatLayoutWrapper />
      </div>
    </div>
  )
}