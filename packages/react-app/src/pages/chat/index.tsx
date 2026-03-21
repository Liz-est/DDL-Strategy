'use client'
import React, { useState, useEffect, useMemo } from 'react'
import ChatLayoutWrapper from '@/layout/chat-layout-wrapper'
import CalendarView from '@/components/CalendarView'

interface AcademicEvent {
  id: string;
  title: string;
  start: string;
  color?: string;
  weight?: number;
  type?: string;
}

export default function ChatPage() {
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([
    { id: '1', title: 'Demo: Project Start', start: '2026-03-10', color: '#3b82f6', weight: 10, type: 'Project' }
  ])

  // 1. 压力分析逻辑
  const pressureInfo = useMemo(() => {
    const totalWeight = academicEvents.reduce((acc, curr) => acc + (curr.weight || 0), 0);
    if (totalWeight > 50) return { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-100' };
    if (totalWeight > 20) return { label: 'Moderate', color: 'text-orange-500', bg: 'bg-orange-100' };
    return { label: 'Balanced', color: 'text-green-500', bg: 'bg-green-100' };
  }, [academicEvents]);

  // 2. 【核心同步逻辑】：使用 MutationObserver 监控聊天气泡
  useEffect(() => {
    const observer = new MutationObserver((_mutations) => {
      // 寻找右侧聊天区域中新出现的文本内容
      const chatContainer = document.querySelector('.flex-1.h-full.overflow-hidden.relative'); // 对应右侧 div 的 class
      if (!chatContainer) return;

      const text = chatContainer.textContent || "";
      
      // 寻找 JSON 块的正则
      const jsonRegex = /\{[\s\S]*?"assessments"[\s\S]*?\}/;
      const match = text.match(jsonRegex);

      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (parsed.assessments && Array.isArray(parsed.assessments)) {
            const newEvents = parsed.assessments.map((item: any, index: number) => ({
              id: `ai-${item.name}-${index}`,
              title: item.name || `Task ${index + 1}`,
              start: item.due_date_raw || new Date().toISOString().split('T')[0],
              weight: item.weight || 10,
              type: item.type || 'Assignment',
              color: (item.weight >= 30 || item.type === 'Exam') ? '#ef4444' : '#10b981'
            }));

            // 去重更新
            setAcademicEvents(prev => {
              const existingIds = new Set(prev.map(ev => ev.id));
              const uniqueNew = newEvents.filter((ev: any) => !existingIds.has(ev.id));
              if (uniqueNew.length === 0) return prev;
              return [...prev, ...uniqueNew];
            });
          }
        } catch {
          // JSON 还在生成中或不完整，忽略
        }
      }
    });

    // 开始观察整个文档的变化
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const handleRePlan = (updatedEvent: any) => {
    setAcademicEvents(prev => 
      prev.map(ev => ev.id === updatedEvent.id ? { ...ev, start: updatedEvent.start } : ev)
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9]">
      {/* 左侧侧边栏 */}
      <div className="w-16 h-full bg-[#1e293b] flex flex-col items-center py-6 gap-8 text-white/50">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20">DS</div>
        <div className="flex flex-col gap-6 text-xl">
          <div className="text-white cursor-pointer transition-colors">📅</div>
          <div className="hover:text-white cursor-pointer opacity-50">📊</div>
        </div>
      </div>

      {/* 中间主区域：Dashboard */}
      <div className="flex-1 h-full flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Academic Strategist</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">AIE1902 Project Hub</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold">Workload Status</span>
              <span className={`text-sm font-black ${pressureInfo.color}`}>{pressureInfo.label}</span>
            </div>
            <div className={`w-8 h-8 ${pressureInfo.bg} rounded-full flex items-center justify-center`}>
              <span className={`text-xs animate-pulse ${pressureInfo.color}`}>●</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <CalendarView events={academicEvents} onEventChange={handleRePlan} />
          </div>
        </main>
      </div>

      {/* 右侧：AI 助手区 */}
      <div className="w-[420px] h-full bg-white border-l border-slate-200 shadow-2xl z-20">
        <ChatLayoutWrapper />
      </div>
    </div>
  )
}