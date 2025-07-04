import { NextRequest, NextResponse } from 'next/server'

import { genDifyRequest, genFormDataProxy } from '@/app/api/utils'

const POST = async (_request: NextRequest, { params }: { params: Promise<{ appId: string }> }) => {
	const { appId } = await params
	const difyRequest = await genDifyRequest(appId)
	const formData = await genFormDataProxy(_request)
	const result = await difyRequest.baseRequest(`/audio-to-text`, {
		method: 'POST',
		body: formData,
	})
	return NextResponse.json({
		code: 200,
		data: await result.json(),
	})
}

export { POST }
