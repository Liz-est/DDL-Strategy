import { NextRequest, NextResponse } from 'next/server'

import { IDifyAppItem } from '@/types'

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

/**
 * 创建 Dify 响应代理
 */
export function createDifyResponseProxy(response: Response) {
	return new Response(response.body, {
		status: response.status,
		headers: {
			'Content-Type': response.headers.get('Content-Type') || 'application/json',
			'X-Version': response.headers.get('X-Version') || '',
			'Access-Control-Allow-Headers': 'X-Version, Authorization, Content-Type',
		},
	})
}

/**
 * 生成 FormData 代理
 */
export async function createFormDataProxy(request: NextRequest) {
	const proxyFormData = new FormData()
	const formData = await request.formData()
	const extensionFromMime = (mimeType: string) => {
		const map: Record<string, string> = {
			'text/plain': '.txt',
			'text/markdown': '.md',
			'application/pdf': '.pdf',
			'application/json': '.json',
			'application/msword': '.doc',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
			'text/csv': '.csv',
		}
		return map[mimeType] || ''
	}
	const ensureFilenameWithExtension = (name: string, mimeType: string, key: string) => {
		const normalizedName = (name || '').trim()
		const hasExtension = /\.[^./\\]+$/.test(normalizedName)
		if (normalizedName && hasExtension) return normalizedName
		const ext = extensionFromMime(mimeType) || '.txt'
		if (!normalizedName) return `${key}-${Date.now()}${ext}`
		return `${normalizedName}${ext}`
	}

	for (const [key, value] of formData.entries()) {
		if (
			typeof value === 'object' &&
			value !== null &&
			typeof value.arrayBuffer === 'function' &&
			'name' in value
		) {
			const filename = ensureFilenameWithExtension(
				typeof value.name === 'string' ? value.name : '',
				typeof value.type === 'string' ? value.type : '',
				key,
			)
			proxyFormData.append(key, value, filename)
		} else {
			proxyFormData.append(key, value as string)
		}
	}

	return proxyFormData
}

/**
 * 统一的 Dify API 响应格式
 */
export function createDifyApiResponse<T>(data: T, status = 200) {
	return NextResponse.json(
		{
			code: status,
			data,
		},
		{ status },
	)
}

/**
 * 从请求中获取用户ID（简化版本，实际项目中可能需要从session或token中获取）
 */
export function getUserIdFromRequest(request: NextRequest): string {
	// 这里简化处理，实际项目中应该从认证信息中获取
	return request.headers.get('x-user-id') || 'anonymous'
}
