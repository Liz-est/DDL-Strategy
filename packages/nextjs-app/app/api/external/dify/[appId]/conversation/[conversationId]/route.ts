import { NextRequest, NextResponse } from 'next/server'

import { genDifyRequest } from '@/app/api/utils'
import { getUserIdFromNextRequest } from '@/lib/session'

const DELETE = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string; conversationId: string }> },
) => {
	const { appId, conversationId } = await params
	const difyRequest = await genDifyRequest(appId)
	const user = await getUserIdFromNextRequest(_request)
	const result = await difyRequest.delete(`/conversations/${conversationId}`, {
		user,
	})
	return NextResponse.json({
		code: 200,
		data: result,
	})
}

export { DELETE }
