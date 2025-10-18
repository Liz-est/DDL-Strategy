import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const count = await prisma.user.count()
		return NextResponse.json({ initialized: count > 0 })
	} catch (error) {
		return NextResponse.json(
			{
				initialized: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		)
	}
}
