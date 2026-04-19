import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

// 获取 Prisma 单例
const prisma = getPrisma();

// 辅助函数：为响应添加 CORS 头
function addCorsHeaders(response: NextResponse, origin?: string | null) {
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// 1. 处理 OPTIONS 预检请求 (解决跨域 CORS 拦截问题)
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  console.log('[academic/sync] OPTIONS 预检请求收到', {
    origin,
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });
  
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
  
  console.log('[academic/sync] OPTIONS 响应已发送', {
    status: 200,
    headers: response.headers,
  });
  
  return response;
}

// 2. 处理 POST 核心请求
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { userId, courseCode, tasks } = body;
    const normalizedCourseCode = typeof courseCode === 'string' && courseCode.trim() ? courseCode.trim() : 'GENERAL';

    if (!userId || !Array.isArray(tasks)) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Missing required fields: userId or tasks' }, { status: 400 }),
        origin
      );
    }

    const normalizedTasks = tasks
      .filter((task: any) => task && typeof task.id === 'string' && task.id.trim() && typeof task.title === 'string' && task.title.trim())
      .map((task: any) => ({
        id: task.id.trim(),
        title: task.title.trim(),
        startAt: task.startAt ? new Date(task.startAt) : null,
        endAt: task.endAt ? new Date(task.endAt) : null,
        allDay: typeof task.allDay === 'boolean' ? task.allDay : true,
        dueDate: task.dueDate || null,
        weight: typeof task.weight === 'number' ? task.weight : Number(task.weight) || 0,
        type: task.type || 'Task',
        courseName: task.courseName || null,
        detail: task.detail || null,
        sourceQuote: task.sourceQuote || null,
        pageNumbersJson: task.pageNumbers ? JSON.stringify(task.pageNumbers) : null,
        estimatedHours: task.estimatedHours ?? null,
        rationale: task.rationale || null,
      }));

    let upsertCount = 0;
    let deletedCount = 0;

    await prisma.$transaction(async tx => {
      if (normalizedTasks.length > 0) {
        await Promise.all(
          normalizedTasks.map(task =>
            tx.$executeRawUnsafe(
              `INSERT INTO academic_tasks (id, user_id, title, start_at, end_at, is_all_day, due_date, weight, type, course_code, course_name, detail, source_quote, page_numbers_json, estimated_hours, rationale) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                start_at = VALUES(start_at),
                end_at = VALUES(end_at),
                is_all_day = VALUES(is_all_day),
                due_date = VALUES(due_date),
                weight = VALUES(weight),
                type = VALUES(type),
                course_name = VALUES(course_name),
                detail = VALUES(detail),
                source_quote = VALUES(source_quote),
                page_numbers_json = VALUES(page_numbers_json),
                estimated_hours = VALUES(estimated_hours),
                rationale = VALUES(rationale)`,
              task.id,
              userId,
              task.title,
              task.startAt,
              task.endAt,
              task.allDay,
              task.dueDate,
              task.weight,
              task.type,
              normalizedCourseCode,
              task.courseName,
              task.detail,
              task.sourceQuote,
              task.pageNumbersJson,
              task.estimatedHours,
              task.rationale
            )
          )
        );
      }
      upsertCount = normalizedTasks.length;

      if (normalizedTasks.length === 0) {
        deletedCount = await tx.$executeRawUnsafe(
          `DELETE FROM academic_tasks WHERE user_id = ? AND course_code = ?`,
          userId,
          normalizedCourseCode
        );
      } else {
        const placeholders = normalizedTasks.map(() => '?').join(', ');
        const ids = normalizedTasks.map(item => item.id);
        deletedCount = await tx.$executeRawUnsafe(
          `DELETE FROM academic_tasks WHERE user_id = ? AND course_code = ? AND id NOT IN (${placeholders})`,
          userId,
          normalizedCourseCode,
          ...ids
        );
      }
    });

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          upsertedCount: upsertCount,
          deletedCount,
          courseCode: normalizedCourseCode,
        },
        { status: 200 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Database Sync Error:', error);
    // 失败返回
    return addCorsHeaders(
      NextResponse.json({ error: error.message }, { status: 500 }),
      origin
    );
  }
}