'use server'

import { NextRequest, NextResponse } from 'next/server'

import { getAppItem } from '@/repository/app'

/**
 * 代理 Dify API 的会话消息历史请求
 *
 * @param request NextRequest 对象
 * @param params 包含应用 ID 和会话 ID 的参数对象
 * @returns 来自 Dify API 的会话消息历史
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { appId: string; conversationId: string } },
) {
	try {
		const { appId, conversationId } = params

		// 获取应用配置
		const app = await getAppItem(appId)
		if (!app) {
			return NextResponse.json({ error: 'App not found' }, { status: 404 })
		}

		const user = request.nextUrl.searchParams.get('user')
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		// 转发请求到 Dify API
		const response = await fetch(
			`${app.requestConfig.apiBase}/messages?conversation_id=${conversationId}&user=${user}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${app.requestConfig.apiKey}`,
				},
			},
		)

		// 返回响应
		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error(`Error fetching conversation messages from Dify API:`, error)
		return NextResponse.json({ error: 'Failed to fetch conversation messages' }, { status: 500 })
	}
}
