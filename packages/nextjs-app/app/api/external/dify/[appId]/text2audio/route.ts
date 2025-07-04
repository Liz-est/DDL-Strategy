import { NextRequest } from 'next/server'

import { genDifyRequest } from '@/app/api/utils'
import { getUserIdFromNextRequest } from '@/lib/session'

const POST = async (_request: NextRequest, { params }: { params: Promise<{ appId: string }> }) => {
	const { appId } = await params
	const body = await _request.json()
	const { message_id, text } = body
	const user = await getUserIdFromNextRequest(_request)
	const difyRequest = await genDifyRequest(appId)
	const result = await difyRequest.baseRequest(`/text-to-audio`, {
		method: 'POST',
		body: JSON.stringify({
			message_id,
			text,
			user,
		}),
		headers: {
			'Content-Type': 'application/json',
		},
	})
	return new Response(result.body, {
		status: result.status,
		headers: {
			'Content-Type': result.headers.get('Content-Type') || 'application/json',
		},
	})
}

export { POST }
