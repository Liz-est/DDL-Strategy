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
  console.log('[policies/save] OPTIONS 预检请求收到', {
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
  
  console.log('[policies/save] OPTIONS 响应已发送', {
    status: 200,
    headers: response.headers,
  });
  
  return response;
}

// 处理 POST 请求 - 保存课程政策到 course_policies 表
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    const body = await request.json();
    const { userId, courseCode, late_policy, absence_policy, grading_notes } = body;

    if (!userId || !courseCode) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required fields: userId or courseCode' },
          { status: 400 }
        ),
        origin
      );
    }

    console.log("📥 后端收到课程政策保存请求", {
      userId,
      courseCode,
      late_policy: !!late_policy,
      absence_policy: !!absence_policy,
      grading_notes: !!grading_notes
    });

    // 使用 upsert 操作：如果已存在则更新，不存在则创建
    // 这样可以避免 UNIQUE 约束冲突
    const policyId = `policy-${userId}-${courseCode}`;
    
    const result = await prisma.$executeRawUnsafe(
      `INSERT INTO course_policies 
       (id, user_id, course_code, late_policy, absence_policy, grading_notes) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       late_policy = VALUES(late_policy),
       absence_policy = VALUES(absence_policy),
       grading_notes = VALUES(grading_notes)`,
      policyId,
      userId,
      courseCode,
      late_policy ? JSON.stringify(late_policy) : null,
      absence_policy ? JSON.stringify(absence_policy) : null,
      grading_notes || null
    );

    console.log("✅ 课程政策已成功保存/更新到数据库，ID:", policyId);

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          message: 'Course policies saved successfully',
          policyId: policyId,
          savedAt: new Date().toISOString(),
        },
        { status: 201 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Save Course Policies Error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to save course policies' },
        { status: 500 }
      ),
      origin
    );
  }
}

// 处理 GET 请求 - 获取课程政策
export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseCode = searchParams.get('courseCode');

    if (!userId || !courseCode) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Missing required parameters: userId and courseCode' },
          { status: 400 }
        ),
        origin
      );
    }

    console.log("[policies/save] 查询课程政策", { userId, courseCode });

    // 查询政策数据
    const policy = await prisma.$queryRawUnsafe(
      `SELECT * FROM course_policies WHERE user_id = ? AND course_code = ? LIMIT 1`,
      userId,
      courseCode
    );

    if (!policy || (Array.isArray(policy) && policy.length === 0)) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Course policy not found' },
          { status: 404 }
        ),
        origin
      );
    }

    const policyData = Array.isArray(policy) ? policy[0] : policy;
    
    // 尝试解析 JSON 字段
    const parsedPolicy = {
      ...policyData,
      late_policy: policyData.late_policy ? JSON.parse(policyData.late_policy) : null,
      absence_policy: policyData.absence_policy ? JSON.parse(policyData.absence_policy) : null,
    };

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          data: parsedPolicy,
        },
        { status: 200 }
      ),
      origin
    );

  } catch (error: any) {
    console.error('❌ Fetch Course Policies Error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to fetch course policies' },
        { status: 500 }
      ),
      origin
    );
  }
}
