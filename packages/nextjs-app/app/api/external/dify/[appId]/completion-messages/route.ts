import { NextRequest } from 'next/server'

import { genDifyRequest, genDifyResponseProxy } from '@/app/api/utils'
import { RESPONSE_MODE } from '@/config'
import { getUserIdFromNextRequest } from '@/lib/session'

const POST = async (_request: NextRequest, { params }: { params: Promise<{ appId: string }> }) => {
	const { appId } = await params
	const { inputs } = await _request.json()
	const difyRequest = await genDifyRequest(appId)
	const user = await getUserIdFromNextRequest(_request)
	const response = await difyRequest.baseRequest(`/completion-messages`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			response_mode: RESPONSE_MODE,
			user,
			inputs,
		}),
	})
	return genDifyResponseProxy(response)
}

export { POST }
