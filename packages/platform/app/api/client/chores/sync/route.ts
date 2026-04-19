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

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { userId, tasks } = body;

    if (!userId || !Array.isArray(tasks)) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Missing required fields: userId or tasks' }, { status: 400 }),
        origin
      );
    }

    const normalizedTasks = tasks
      .filter(
        (task: any) =>
          task && typeof task.id === 'string' && task.id.trim() && typeof task.title === 'string' && task.title.trim()
      )
      .map((task: any) => ({
        id: task.id.trim(),
        title: task.title.trim(),
        startAt: task.startAt ? new Date(task.startAt) : null,
        endAt: task.endAt ? new Date(task.endAt) : null,
        allDay: typeof task.allDay === 'boolean' ? task.allDay : true,
        priority: typeof task.priority === 'string' ? task.priority : null,
        location: typeof task.location === 'string' ? task.location : null,
        detail: task.detail || null,
      }));

    let upsertCount = 0;
    let deletedCount = 0;

    await prisma.$transaction(async tx => {
      if (normalizedTasks.length > 0) {
        await Promise.all(
          normalizedTasks.map(task =>
            tx.$executeRawUnsafe(
              `INSERT INTO chore_tasks (id, user_id, title, start_at, end_at, is_all_day, priority, location, detail)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                start_at = VALUES(start_at),
                end_at = VALUES(end_at),
                is_all_day = VALUES(is_all_day),
                priority = VALUES(priority),
                location = VALUES(location),
                detail = VALUES(detail)`,
              task.id,
              userId,
              task.title,
              task.startAt,
              task.endAt,
              task.allDay,
              task.priority,
              task.location,
              task.detail
            )
          )
        );
      }
      upsertCount = normalizedTasks.length;

      if (normalizedTasks.length === 0) {
        deletedCount = await tx.$executeRawUnsafe(`DELETE FROM chore_tasks WHERE user_id = ?`, userId);
      } else {
        const placeholders = normalizedTasks.map(() => '?').join(', ');
        const ids = normalizedTasks.map(item => item.id);
        deletedCount = await tx.$executeRawUnsafe(
          `DELETE FROM chore_tasks WHERE user_id = ? AND id NOT IN (${placeholders})`,
          userId,
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
        },
        { status: 200 }
      ),
      origin
    );
  } catch (error: any) {
    console.error('Chores sync error:', error);
    return addCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }), origin);
  }
}
