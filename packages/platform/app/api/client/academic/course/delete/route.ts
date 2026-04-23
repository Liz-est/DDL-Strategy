import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const prisma = getPrisma()

const BUCKET_CODES = new Set(['UNKNOWN', 'GENERAL'])

function addCorsHeaders(response: NextResponse, origin?: string | null) {
	response.headers.set('Access-Control-Allow-Origin', origin || '*')
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
	response.headers.set('Access-Control-Max-Age', '86400')
	return response
}

export async function OPTIONS(request: Request) {
	const origin = request.headers.get('origin')
	return addCorsHeaders(new NextResponse(null, { status: 200 }), origin)
}

/**
 * Remove one course and scoped academic data for the user.
 * Does not delete processing_results (may be shared across courses).
 */
export async function POST(request: Request) {
	const origin = request.headers.get('origin')
	try {
		const body = await request.json()
		const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
		const courseCode = typeof body.courseCode === 'string' ? body.courseCode.trim() : ''

		if (!userId || !courseCode) {
			return addCorsHeaders(NextResponse.json({ error: 'Missing userId or courseCode' }, { status: 400 }), origin)
		}
		if (BUCKET_CODES.has(courseCode)) {
			return addCorsHeaders(
				NextResponse.json({ error: 'Cannot delete bucket placeholder course codes (UNKNOWN / GENERAL).' }, { status: 400 }),
				origin
			)
		}

		const courseRowId = `course-${userId}-${courseCode}`

		await prisma.$transaction(async tx => {
			await tx.$executeRawUnsafe(
				`DELETE FROM ingestion_snapshots WHERE user_id = ? AND (course_code = ? OR course_id = ?)`,
				userId,
				courseCode,
				courseRowId
			)
			await tx.$executeRawUnsafe(`DELETE FROM academic_tasks WHERE user_id = ? AND course_code = ?`, userId, courseCode)
			// Rules cascade when policy row is removed (FK ON DELETE CASCADE)
			await tx.$executeRawUnsafe(`DELETE FROM course_policies WHERE user_id = ? AND course_code = ?`, userId, courseCode)
			await tx.$executeRawUnsafe(`DELETE FROM academic_courses WHERE user_id = ? AND course_code = ?`, userId, courseCode)
		})

		return addCorsHeaders(
			NextResponse.json({ success: true, data: { userId, courseCode } }, { status: 200 }),
			origin
		)
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Failed to delete course'
		return addCorsHeaders(NextResponse.json({ error: message }, { status: 500 }), request.headers.get('origin'))
	}
}
