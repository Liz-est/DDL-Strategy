import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

const prisma = getPrisma()

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
 * Rename a course code while preserving existing data rows.
 * This updates code references in tasks/policies/snapshots/course profile atomically.
 */
export async function POST(request: Request) {
	const origin = request.headers.get('origin')
	try {
		const body = await request.json()
		const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
		const fromCourseCode = typeof body.fromCourseCode === 'string' ? body.fromCourseCode.trim() : ''
		const toCourseCode = typeof body.toCourseCode === 'string' ? body.toCourseCode.trim() : ''
		if (!userId || !fromCourseCode || !toCourseCode) {
			return addCorsHeaders(
				NextResponse.json({ error: 'Missing userId, fromCourseCode or toCourseCode' }, { status: 400 }),
				origin
			)
		}
		if (fromCourseCode === toCourseCode) {
			return addCorsHeaders(NextResponse.json({ success: true }, { status: 200 }), origin)
		}
		const oldCourseId = `course-${userId}-${fromCourseCode}`
		const newCourseId = `course-${userId}-${toCourseCode}`
		const oldPolicyId = `policy-${userId}-${fromCourseCode}`
		const newPolicyId = `policy-${userId}-${toCourseCode}`

		const existingTarget = (await prisma.$queryRawUnsafe(
			`SELECT id FROM academic_courses WHERE user_id = ? AND course_code = ? LIMIT 1`,
			userId,
			toCourseCode
		)) as { id: string }[]
		if (existingTarget.length > 0) {
			return addCorsHeaders(
				NextResponse.json({ error: `Target course code "${toCourseCode}" already exists.` }, { status: 409 }),
				origin
			)
		}

		await prisma.$transaction(async tx => {
			await tx.$executeRawUnsafe(
				`UPDATE academic_tasks SET course_code = ? WHERE user_id = ? AND course_code = ?`,
				toCourseCode,
				userId,
				fromCourseCode
			)
			await tx.$executeRawUnsafe(
				`UPDATE ingestion_snapshots SET course_code = ?, course_id = ? WHERE user_id = ? AND (course_code = ? OR course_id = ?)`,
				toCourseCode,
				newCourseId,
				userId,
				fromCourseCode,
				oldCourseId
			)
			await tx.$executeRawUnsafe(
				`UPDATE course_policies SET id = ?, course_id = ?, course_code = ? WHERE user_id = ? AND course_code = ?`,
				newPolicyId,
				newCourseId,
				toCourseCode,
				userId,
				fromCourseCode
			)
			await tx.$executeRawUnsafe(
				`UPDATE course_policy_rules SET policy_id = ? WHERE policy_id = ?`,
				newPolicyId,
				oldPolicyId
			)
			await tx.$executeRawUnsafe(
				`UPDATE academic_courses SET id = ?, course_code = ? WHERE user_id = ? AND course_code = ?`,
				newCourseId,
				toCourseCode,
				userId,
				fromCourseCode
			)
		})

		return addCorsHeaders(
			NextResponse.json({ success: true, data: { userId, fromCourseCode, toCourseCode } }, { status: 200 }),
			origin
		)
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Failed to rename course code'
		return addCorsHeaders(NextResponse.json({ error: message }, { status: 500 }), request.headers.get('origin'))
	}
}
