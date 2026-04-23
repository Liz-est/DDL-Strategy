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

type Nullable<T> = T | null | undefined

const clamp0to100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** Accept JSON numbers or numeric strings; null / missing / empty clears the override. */
const parseOptional0to100 = (v: unknown): number | null => {
	if (v === null || v === undefined) return null
	if (typeof v === 'string' && v.trim() === '') return null
	const n = typeof v === 'number' ? v : Number(v)
	if (!Number.isFinite(n)) return null
	return clamp0to100(n)
}

/**
 * Create or update `academic_courses` (profile + optional manual progress overrides).
 * Clears a manual field when the client sends `null`.
 */
export async function POST(request: Request) {
	const origin = request.headers.get('origin')
	try {
		const body = await request.json()
		const {
			userId,
			courseCode,
			name: nameIn,
			courseName: courseNameIn,
			description: descIn,
			sourceQuote: quoteIn,
			manualCompletionRate: mcrIn,
			manualSemesterProgress: mspIn,
		} = body as {
			userId: string
			courseCode: string
			name?: Nullable<string>
			courseName?: Nullable<string>
			description?: Nullable<string>
			sourceQuote?: Nullable<string>
			manualCompletionRate?: unknown
			manualSemesterProgress?: unknown
		}

		if (!userId || !courseCode) {
			return addCorsHeaders(NextResponse.json({ error: 'Missing userId or courseCode' }, { status: 400 }), origin)
		}

		const id = `course-${userId}-${courseCode}`

		const name = nameIn == null || nameIn === '' ? null : String(nameIn)
		const courseName = courseNameIn == null || courseNameIn === '' ? null : String(courseNameIn)
		const description = descIn == null || descIn === '' ? null : String(descIn)
		const sourceQuote = quoteIn == null || quoteIn === '' ? null : String(quoteIn)

		const manualCompletion = parseOptional0to100(mcrIn)
		const manualSemester = parseOptional0to100(mspIn)

		await prisma.$executeRawUnsafe(
			`INSERT INTO academic_courses
        (id, user_id, course_code, name, course_name, description, source_quote, raw_course_info_json, manual_completion_rate, manual_semester_progress, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         course_name = VALUES(course_name),
         description = VALUES(description),
         source_quote = VALUES(source_quote),
         manual_completion_rate = VALUES(manual_completion_rate),
         manual_semester_progress = VALUES(manual_semester_progress),
         updated_at = NOW()`,
			id,
			userId,
			courseCode,
			name,
			courseName,
			description,
			sourceQuote,
			manualCompletion,
			manualSemester
		)

		return addCorsHeaders(
			NextResponse.json(
				{
					success: true,
					data: { id, courseCode, manualCompletionRate: manualCompletion, manualSemesterProgress: manualSemester },
				},
				{ status: 200 }
			),
			origin
		)
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Failed to save course'
		return addCorsHeaders(NextResponse.json({ error: message }, { status: 500 }), request.headers.get('origin'))
	}
}
