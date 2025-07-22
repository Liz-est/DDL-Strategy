'use server'

import { NextRequest } from 'next/server'

import { createDifyApiResponse, handleApiError, proxyDifyRequest } from '@/lib/api-utils'
import { getAppItem } from '@/repository/app'

/**
 * 提交消息反馈
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: { appId: string; messageId: string } },
) {
	try {
		const { appId, messageId } = await params

		// 获取应用配置
		const app = await getAppItem(appId)
		if (!app) {
			return createDifyApiResponse({ error: 'App not found' }, 404)
		}
		// 获取请求体
		const { rating, content } = await request.json()

		const user = request.nextUrl.searchParams.get('user')

		// 代理请求到 Dify API
		const response = await proxyDifyRequest(
			app.requestConfig.apiBase,
			app.requestConfig.apiKey,
			`/messages/${messageId}/feedbacks`,
			{
				method: 'POST',
				body: JSON.stringify({
					user,
					rating,
					content,
				}),
			},
		)

		const data = await response.json()
		return createDifyApiResponse(data, response.status)
	} catch (error) {
		return handleApiError(error, `Error submitting feedback for ${params.appId}`)
	}
}
