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
    // App Router 获取 body 的正确方式
    const body = await request.json();
    const { userId, courseCode, tasks } = body;

    console.log("📥 后端收到同步请求, 任务数量:", tasks?.length);

    // 写入数据库逻辑 (使用 INSERT IGNORE 防止重复插入报错)
    const result = await Promise.all(
      tasks.map((task: any) => 
        prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO academic_tasks (id, user_id, title, due_date, weight, type, course_code) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          task.id, userId, task.title, task.dueDate, task.weight, task.type, courseCode
        )
      )
    );

    // 成功返回并加上允许跨域的 Header
    return addCorsHeaders(
      NextResponse.json({ success: true, count: result.length }, { status: 200 }),
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