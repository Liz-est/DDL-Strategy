'use client'
import React, { useState, useEffect } from 'react'
import ChatLayoutWrapper from '@/layout/chat-layout-wrapper'
import CalendarView from '@/components/CalendarView' // 确保你已经创建了这个文件

export default function ChatPage() {
  // 1. 在这里定义日历数据状态
  const [academicEvents, setAcademicEvents] = useState([
    { id: '1', title: 'AIE1902: Project Proposal', start: '2026-03-10', color: '#3b82f6' },
    { id: '2', title: 'MAT3007H: Midterm Exam', start: '2026-03-13', color: '#ef4444' }
  ])

  // 监听 AI 返回的数据
  useEffect(() => {
    const handler = (e: any) => {
      const text = e.detail;
      if (text.includes('assessments')) { // 如果包含 JSON 结构
        try {
          const parsed = JSON.parse(text);
          if (parsed.assessments && Array.isArray(parsed.assessments)) {
            // 解析并 setAcademicEvents
            const newEvents = parsed.assessments.map((item: any, index: number) => ({
              id: `ai-${Date.now()}-${index}`,
              title: item.title || item.name || `Event ${index + 1}`,
              start: item.date || item.start || new Date().toISOString().split('T')[0],
              color: '#10b981' // 绿色表示 AI 生成的事件
            }));
            setAcademicEvents(prev => [...prev, ...newEvents]);
          }
        } catch (error) {
          console.error('解析 AI 返回的 JSON 失败:', error);
        }
      }
    };
    window.addEventListener('dify-data-update', handler);
    return () => window.removeEventListener('dify-data-update', handler);
  }, []);

  // 2. 预留重排逻辑接口
  const handleRePlan = (updatedEvent: any) => {
    console.log('触发重排逻辑，新日期为:', updatedEvent.start)
    // 更新本地状态让日历先动起来
    setAcademicEvents(prev => 
      prev.map(ev => ev.id === updatedEvent.id ? { ...ev, start: updatedEvent.start } : ev)
    )
    // 未来在这里加入 fetch('/api/replan') 逻辑
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* 左侧：日历区域 (占 60% 宽度) */}
      <div className="w-[60%] h-full border-r border-gray-200 bg-white shadow-inner">
        <CalendarView 
          events={academicEvents} 
          onEventChange={handleRePlan} 
        />
      </div>

      {/* 右侧：原有的聊天区域 (占 40% 宽度) */}
      <div className="flex-1 h-full overflow-hidden relative">
        <ChatLayoutWrapper />
      </div>
    </div>
  )
}