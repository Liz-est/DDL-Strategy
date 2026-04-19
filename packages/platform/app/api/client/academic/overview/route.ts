import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

const prisma = getPrisma();

function addCorsHeaders(response: NextResponse, origin?: string | null) {
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return addCorsHeaders(new NextResponse(null, { status: 200 }), origin);
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return addCorsHeaders(NextResponse.json({ error: 'Missing required parameter: userId' }, { status: 400 }), origin);
    }

    const [courses, policies, rules, tasks, snapshots, processingResults] = await Promise.all([
      prisma.$queryRawUnsafe(`SELECT * FROM academic_courses WHERE user_id = ? ORDER BY updated_at DESC`, userId),
      prisma.$queryRawUnsafe(`SELECT * FROM course_policies WHERE user_id = ? ORDER BY updated_at DESC`, userId),
      prisma.$queryRawUnsafe(
        `SELECT r.* FROM course_policy_rules r
         JOIN course_policies p ON p.id = r.policy_id
         WHERE p.user_id = ?
         ORDER BY r.rule_order ASC`,
        userId
      ),
      prisma.$queryRawUnsafe(
        `SELECT * FROM academic_tasks
         WHERE user_id = ?
         ORDER BY COALESCE(start_at, STR_TO_DATE(due_date, '%Y-%m-%d')) ASC, created_at DESC`,
        userId
      ),
      prisma.$queryRawUnsafe(`SELECT * FROM ingestion_snapshots WHERE user_id = ? ORDER BY created_at DESC`, userId),
      prisma.$queryRawUnsafe(`SELECT * FROM processing_results WHERE user_id = ? ORDER BY created_at DESC`, userId),
    ]);

    return addCorsHeaders(
      NextResponse.json(
        {
          success: true,
          data: {
            courses: Array.isArray(courses) ? courses : [],
            policies: Array.isArray(policies) ? policies : [],
            rules: Array.isArray(rules) ? rules : [],
            tasks: Array.isArray(tasks) ? tasks : [],
            snapshots: Array.isArray(snapshots) ? snapshots : [],
            processingResults: Array.isArray(processingResults) ? processingResults : [],
          },
        },
        { status: 200 }
      ),
      origin
    );
  } catch (error: any) {
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'Failed to load academic overview' },
        { status: 500 }
      ),
      origin
    );
  }
}
