export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'

import { createDifyApiResponse, createFormDataProxy, handleApiError } from '@/lib/api-utils'
import { getAppItem } from '@/repository/app'

/**
 * 上传文件到 Dify
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) {
	try {
		const { appId } = await params

		// 获取应用配置
		const app = await getAppItem(appId)
		if (!app) {
			return createDifyApiResponse({ error: 'App not found' }, 404)
		}

		// 构建代理 FormData
		const proxyFormData = await createFormDataProxy(request)

		// 代理请求到 Dify API
		const response = await fetch(`${app.requestConfig.apiBase}/files/upload`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${app.requestConfig.apiKey}`,
			},
			body: proxyFormData,
		})
		const contentType = response.headers.get('content-type') || ''
		const rawText = await response.text()
		let parsedData: unknown = rawText
		if (contentType.includes('application/json')) {
			try {
				parsedData = rawText ? JSON.parse(rawText) : {}
			} catch {
				parsedData = {
					error: 'Invalid JSON from upstream upload API',
					raw: rawText,
				}
			}
		}
		return createDifyApiResponse(parsedData, response.status)
	} catch (error) {
		const resolvedParams = await params
		return handleApiError(error, `Error uploading file for ${resolvedParams.appId}`)
	}
}
