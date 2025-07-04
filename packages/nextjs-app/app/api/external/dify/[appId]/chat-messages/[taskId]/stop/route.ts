import { NextRequest, NextResponse } from 'next/server'

import { genDifyRequest } from '@/app/api/utils'
import { getUserIdFromNextRequest } from '@/lib/session'

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string; taskId: string }> },
) => {
	const { appId, taskId } = await params
	const user = await getUserIdFromNextRequest(_request)
	const difyRequest = await genDifyRequest(appId)
	const result = await difyRequest.post(`/chat-messages/${taskId}/stop`, {
		user,
	})
	return NextResponse.json({
		code: 200,
		data: result,
	})
}

export { POST }
