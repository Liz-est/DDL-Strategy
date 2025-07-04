import { NextRequest, NextResponse } from 'next/server'

import { genDifyRequest } from '@/app/api/utils'

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	const { appId } = await params
	const request = await genDifyRequest(appId)
	try {
		const result = await request.get('/info')
		return NextResponse.json(result)
	} catch (error) {
		return NextResponse.json({
			error,
		})
	}
}
