'use server'

import { NextRequest } from 'next/server'

import { createDifyResponseProxy, getUserIdFromRequest } from '@/lib/api-utils'
import { getAppItem } from '@/repository/app'

/**
 * 发送完成消息（文本生成）
 */
export async function POST(request: NextRequest, { params }: { params: { appId: string } }) {
	try {
		const { appId } = params

		// 获取应用配置
		const app = await getAppItem(appId)
		if (!app) {
			return new Response(JSON.stringify({ error: 'App not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// 获取请求体
		const { inputs } = await request.json()

		// 获取用户ID
		const userId = getUserIdFromRequest(request)

		// 代理请求到 Dify API
		const response = await fetch(`${app.requestConfig.apiBase}/completion-messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${app.requestConfig.apiKey}`,
			},
			body: JSON.stringify({
				response_mode: 'streaming',
				user: userId,
				inputs,
			}),
		})

		// 返回流式响应
		return createDifyResponseProxy(response)
	} catch (error) {
		console.error(`Error sending completion message for ${params.appId}:`, error)
		return new Response(JSON.stringify({ error: 'Failed to send completion message' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
