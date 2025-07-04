import { NextRequest, NextResponse } from 'next/server'

import { genDifyRequest, genFormDataProxy } from '@/app/api/utils'

const POST = async (_request: NextRequest, { params }: { params: Promise<{ appId: string }> }) => {
	const { appId } = await params
	const difyRequest = await genDifyRequest(appId)

	// 构建新的 formData 以便转发到第三方
	const proxyFormData = await genFormDataProxy(_request)
	const result = await difyRequest.baseRequest(`/files/upload`, {
		method: 'POST',
		body: proxyFormData,
	})
	const data = await result.json()
	return NextResponse.json({
		code: 200,
		data,
	})
}

export { POST }
