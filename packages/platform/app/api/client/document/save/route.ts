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

// 处理 OPTIONS 预检请求 (解决跨域 CORS 拦截问题)
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  console.log('[document/save] OPTIONS 预检请求收到', {
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
  
  console.log('[document/save] OPTIONS 响应已发送', {
    status: 200,
    headers: response.headers,
  });
  
  return response;
}

// 处理 POST 请求 - 保存前端返回的JSON数据到数据库
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    // App Router 获取 body 的正确方式
    const body = await request.json();
    const { userId, courseCode, jsonData, sourceType = 'document', description } = body;

    if (!userId || !jsonData) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required fields: userId or jsonData' },
          { status: 400 }
        ),
        origin
      );
    }

    console.log("📥 后端收到文档处理结果，准备存储到数据库");

    // 将JSON数据存储到数据库
    const result = await prisma.processingResult.create({
      data: {
        userId,
        courseCode: courseCode || null,
        rawData: typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData),
        sourceType,
        description: description || null,
      },
    });

    console.log("✅ 数据已成功保存到数据库，ID:", result.id);

    // 成功返回并加上允许跨域的 Header
    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          message: 'JSON data saved successfully',
          resultId: result.id,
          savedAt: result.processedAt,
        },
        { status: 201 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Database Save Error:', error);
    // 失败返回
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to save data' },
        { status: 500 }
      ),
      origin
    );
  }
}

// 处理 GET 请求 - 获取存储的JSON数据
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const resultId = searchParams.get('id');
    const courseCode = searchParams.get('courseCode');

    if (!userId && !resultId) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required parameters: userId or id' },
          { status: 400 }
        ),
        origin
      );
    }

    let results;

    if (resultId) {
      // 查询单个结果
      results = await prisma.processingResult.findUnique({
        where: { id: resultId },
      });
    } else {
      // 查询用户的所有结果
      const where: any = { userId };
      if (courseCode) {
        where.courseCode = courseCode;
      }
      results = await prisma.processingResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    }

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          data: results,
        },
        { status: 200 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Database Query Error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to query data' },
        { status: 500 }
      ),
      origin
    );
  }
}
