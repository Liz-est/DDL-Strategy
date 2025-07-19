import { IDifyAppItem } from '@dify-chat/core'
import { NextResponse } from 'next/server'

/**
 * 统一的 API 错误处理
 */
export function handleApiError(error: unknown, context: string) {
	console.error(`${context}:`, error)

	if (error instanceof Error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

/**
 * 创建安全的应用对象（隐藏敏感信息）
 */
export function createSafeApp(app: IDifyAppItem) {
	return {
		...app,
		requestConfig: {
			apiBase: app.requestConfig.apiBase,
			apiKey: '******', // 隐藏 API Key
		},
	}
}

/**
 * 代理 Dify API 请求的通用函数
 */
export async function proxyDifyRequest(
	apiBase: string,
	apiKey: string,
	endpoint: string,
	options: RequestInit = {},
) {
	const url = `${apiBase}${endpoint}`

	const response = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			...options.headers,
		},
	})

	return response
}
