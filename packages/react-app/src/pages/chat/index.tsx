"use client"
import { useState, useEffect, useMemo } from 'react'
import { Modal, Input, message } from 'antd'
import ChatLayoutWrapper from '@/layout/chat-layout-wrapper'
import CalendarView from '@/components/CalendarView'
import config from '@/config/runtime-config'

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [currentSelection, setCurrentSelection] = useState<any>(null);

  const handleDateSelect = (selectInfo: any) => {
    setCurrentSelection(selectInfo);
    setIsModalOpen(true);
  };

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
      color: '#8b5cf6',
      extendedProps: { type: 'Manual', weight: 0 }
    };

    setAcademicEvents(prev =>[...prev, newEvent]);
    setIsModalOpen(false);
    setNewEventTitle('');
    message.success('Task added to calendar');
  };

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

  // 【核心修复区域】：剥离数据库同步逻辑
  useEffect(() => {
    console.log("战略家：实时监听器已启动...");

    const userId = 'cmm9gaoo2000101nu78lnxx2v'; // 替换为你截图中的真实 ID

    const API_BASE = (config.PUBLIC_APP_API_BASE || '').replace(/\/$/, '')

    // 1. 保存完整JSON数据到数据库的函数
    const saveJsonToDatabase = async (jsonData: any, courseCode: string, description?: string) => {
      try {
        const payload = {
          userId,
          courseCode: courseCode || null,
          jsonData,
          sourceType: 'academic',
          description: description || 'Academic tasks processing result'
        };

        console.log("💾 [JSON Save] 准备保存完整JSON到数据库...");

        const url = API_BASE ? `${API_BASE}/document/save` : '/api/client/document/save'
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ [JSON Save] JSON数据已成功保存到数据库，ID:", data.resultId);
        } else {
          const errorData = await response.text();
          console.error("❌ [JSON Save] 保存失败:", errorData);
        }
      } catch (err) {
        console.error("📡 [JSON Save] 网络请求异常:", err);
      }
    };

    // 2. 独立定义数据库同步函数
    const syncToDatabase = async (taskList: any[], courseCode: string) => {
      try {
        const payload = {
          userId,
          courseCode: courseCode || 'UNKNOWN',
          tasks: taskList.map(task => ({
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: task.name || task.title,
            dueDate: task.due_date_raw,
            weight: task.weight || 0,
            type: task.task_type_standardized || task.type || 'Task'
          }))
        };

        console.log("🚀 [DB Sync] 准备发送同步请求到后端...", payload);

        const url = API_BASE ? `${API_BASE}/academic/sync` : '/api/client/academic/sync'
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log("✅[DB Sync] 数据库同步成功！");
        } else {
          const errorData = await response.text();
          console.error("❌ [DB Sync] 数据库同步失败:", errorData);
        }
      } catch (err) {
        console.error("📡 [DB Sync] 网络请求异常:", err);
      }
    };

    // 3. 文本解析处理器（增强版：加入健壮的JSON提取与调试日志）
    const handler = (text: string) => {
      try {
        console.log('[战略家.handler] invoked, text length:', text?.length ?? 0);

        const jsonRegex = /(\[[\s\S]*?due_date_raw[\s\S]*?\]|\{[\s\S]*?assessments[\s\S]*?\})/;
        const execResult = jsonRegex.exec(text || '');
        console.log('[战略家.handler] match found:', !!execResult);

        if (!execResult) return;

        // 寻找 JSON 起始位置（'[' 或 '{'）
        const searchStart = execResult.index ?? 0;
        const idxArray = text!.indexOf('[', searchStart);
        const idxObj = text!.indexOf('{', searchStart);
        let startPos = -1;
        if (idxArray !== -1 && idxObj !== -1) startPos = Math.min(idxArray, idxObj);
        else startPos = Math.max(idxArray, idxObj);
        if (startPos === -1) startPos = execResult.index || 0;

        // helper: 判断位置前是否被转义
        const isEscaped = (s: string, pos: number) => {
          let i = pos - 1;
          let count = 0;
          while (i >= 0 && s[i] === '\\') { count++; i--; }
          return count % 2 === 1;
        };

        // helper: 提取平衡的 JSON 字符串
        const extractBalanced = (s: string, start: number) => {
          const open = s[start];
          const pairs: any = { '[': ']', '{': '}' };
          const close = pairs[open];
          if (!close) return null;
          const stack: string[] = [open];
          let inString = false;
          let strChar: string | null = null;
          for (let i = start + 1; i < s.length; i++) {
            const ch = s[i];
            if ((ch === '"' || ch === "'") && !isEscaped(s, i)) {
              if (!inString) { inString = true; strChar = ch; }
              else if (strChar === ch) { inString = false; strChar = null; }
              continue;
            }
            if (inString) continue;
            if (ch === '{' || ch === '[') stack.push(ch);
            else if (ch === '}' || ch === ']') {
              const last = stack[stack.length - 1];
              if ((last === '{' && ch === '}') || (last === '[' && ch === ']')) stack.pop();
              else return null; // mismatch
              if (stack.length === 0) return s.slice(start, i + 1);
            }
          }
          return null; // not balanced
        };

        const candidate = extractBalanced(text!, startPos);
        let rawJson = candidate ?? execResult[0];
        rawJson = rawJson.replace(/```json|```/g, '');
        console.log('[战略家.handler] rawJson preview:', rawJson.slice(0, 400));

        // 尝试解析，若失败则尝试清理尾随逗号后再解析
        const tryParse = (str: string) => {
          try { return JSON.parse(str); } catch (e) { return null; }
        };

        let parsed: any = tryParse(rawJson);
        if (!parsed) {
          // 移除尾随逗号（对象或数组中最后一个元素后的逗号）
          const cleaned = rawJson.replace(/,\s*(?=[}\]])/g, '');
          parsed = tryParse(cleaned);
          if (parsed) rawJson = cleaned;
        }

        // 如果仍无法解析，尝试提取其中的对象并单独解析（宽松模式）
        if (!parsed) {
          console.warn('[战略家.handler] primary JSON.parse failed, trying object-extraction fallback');
          const objs: any[] = [];
          for (let i = 0; i < rawJson.length; i++) {
            if (rawJson[i] === '{' && !isEscaped(rawJson, i)) {
              const objStr = extractBalanced(rawJson, i);
              if (objStr) {
                const cleanedObj = objStr.replace(/,\s*(?=[}\]])/g, '');
                const o = tryParse(cleanedObj);
                if (o) objs.push(o);
                i += objStr.length - 1;
              }
            }
          }
          console.log('[战略家.handler] fallback extracted objects:', objs.length);
          if (objs.length > 0) {
            // 过滤出像任务结构的对象
            const tasksFromObjs = objs.filter(o => o && (o.due_date_raw || o.task_type_standardized || o.name || o.weight));
            if (tasksFromObjs.length > 0) {
              parsed = tasksFromObjs;
            }
          }
        }

        if (!parsed) {
          console.error('[战略家.handler] JSON parse/error: unable to parse extracted JSON');
          return;
        }

        const taskList = Array.isArray(parsed) ? parsed : (parsed.assessments || []);
        const courseCode = !Array.isArray(parsed) && parsed.course_info ? parsed.course_info.course_code : 'UNKNOWN';

        console.log('[战略家.handler] extracted tasks:', taskList.length, 'courseCode:', courseCode);

        if (taskList.length > 0) {
          const newEvents = taskList.map((item: any, index: number) => ({
            id: `ai-${item.name}-${index}`,
            title: item.name || 'Unnamed Task',
            start: item.due_date_raw || new Date().toISOString().split('T')[0],
            weight: item.weight || 0,
            type: item.task_type_standardized || item.type,
            extendedProps: {
              weight: item.weight,
              type: item.task_type_standardized || item.type,
              estimated_hours: item.estimated_hours,
              rationale: item.rationale,
            },
            color: (item.type === 'Exam' || item.weight >= 30) ? '#ef4444' : '#10b981',
          }));

          // 无论是否有新事件，都保存完整的JSON到数据库，以便审计及校验
          try {
            saveJsonToDatabase(parsed, courseCode, `Extracted ${newEvents.length} tasks`);
          } catch (err) {
            console.error('[战略家.handler] saveJsonToDatabase error:', err);
          }

          setAcademicEvents(prev => {
            const existingTitles = new Set(prev.map(ev => ev.title));
            const uniqueNew = newEvents.filter((ev: any) => !existingTitles.has(ev.title));
            console.log('[战略家.handler] newEvents:', newEvents.length, 'uniqueNew:', uniqueNew.length);
            if (uniqueNew.length > 0) {
              console.log(`战略家：成功抓取 ${uniqueNew.length} 个新任务！`);
              // 仅当存在真正的新任务时，同步任务表，避免重复插入
              syncToDatabase(taskList, courseCode);
            }
            return [...prev, ...uniqueNew];
          });
        }
      } catch (err) {
        console.error('[战略家.handler] unexpected error:', err);
      }
    };

    // MutationObserver 调试：记录触发次数与内容预览
    const observer = new MutationObserver((mutationsList) => {
      try {
        console.log('[战略家.observer] fired, mutations:', mutationsList.length);
        const content = document.body ? document.body.innerText : '';
        console.log('[战略家.observer] document length:', content.length, 'preview:', content.slice(0, 300));
        handler(content);
      } catch (err) {
        console.error('[战略家.observer] error:', err);
      }
    });

    const target = document.body || document.documentElement;
    observer.observe(target, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  },[]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f9]">
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
              onDateSelect={handleDateSelect}
            />
          </div>
        </main>
      </div>

      <div className="w-[420px] h-full bg-white border-l border-slate-200 shadow-2xl z-20">
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