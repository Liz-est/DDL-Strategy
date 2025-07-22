'use server'

import { NextRequest } from 'next/server'

import {
	createDifyApiResponse,
	getUserIdFromRequest,
	handleApiError,
	proxyDifyRequest,
} from '@/lib/api-utils'
import { getAppItem } from '@/repository/app'

/**
 * 获取消息建议
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { appId: string; messageId: string } },
) {
	try {
		const { appId, messageId } = params

		// 获取应用配置
		const app = await getAppItem(appId)
		if (!app) {
			return createDifyApiResponse({ error: 'App not found' }, 404)
		}

		// 获取用户ID
		const userId = getUserIdFromRequest(request)

		// 代理请求到 Dify API
		const response = await proxyDifyRequest(
			app.requestConfig.apiBase,
			app.requestConfig.apiKey,
			`/messages/${messageId}/suggested?user=${userId}`,
		)

		const data = await response.json()
		return createDifyApiResponse(data, response.status)
	} catch (error) {
		return handleApiError(
			error,
			`Error fetching message suggestions for ${params.messageId} in ${params.appId}`,
		)
	}
}
