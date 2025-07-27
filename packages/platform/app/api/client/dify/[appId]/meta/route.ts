'use server'

import { NextRequest } from 'next/server'

import { createDifyApiResponse, handleApiError, proxyDifyRequest } from '@/lib/api-utils'
import { getAppItem } from '@/repository/app'

/**
 * 获取应用元数据
 */
export async function GET(request: NextRequest, { params }: { params: { appId: string } }) {
	try {
		const { appId } = params

		// 获取应用配置
		const app = await getAppItem(appId)
		if (!app) {
			return createDifyApiResponse({ error: 'App not found' }, 404)
		}

		// 代理请求到 Dify API
		const response = await proxyDifyRequest(
			app.requestConfig.apiBase,
			app.requestConfig.apiKey,
			'/meta',
		)

		const data = await response.json()
		return createDifyApiResponse(data, response.status)
	} catch (error) {
		return handleApiError(error, `Error fetching app meta for ${params.appId}`)
	}
}
