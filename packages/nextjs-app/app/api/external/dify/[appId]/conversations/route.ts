import { NextRequest, NextResponse } from 'next/server'

import { genDifyRequest } from '@/app/api/utils'
import { getUserIdFromNextRequest } from '@/lib/session'

const GET = async (_request: NextRequest, { params }: { params: Promise<{ appId: string }> }) => {
	const { appId } = await params
	const user = await getUserIdFromNextRequest(_request)
	const limit = _request.nextUrl.searchParams.get('limit')
	const difyRequest = await genDifyRequest(appId)
	const result = await difyRequest.get(`/conversations`, {
		user,
		limit: (limit || 100).toString(),
	})
	return NextResponse.json({
		code: 200,
		data: result,
	})
}

export { GET }
