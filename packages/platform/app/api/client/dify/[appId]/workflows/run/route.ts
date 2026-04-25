export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'

import {
	createDifyApiResponse,
	createDifyResponseProxy,
	getUserIdFromRequest,
	handleApiError,
	proxyDifyRequest,
} from '@/lib/api-utils'
import { getAppItem } from '@/repository/app'

/**
 * 获取工作流运行结果
 */
export async function GET(
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

		// 获取查询参数中的运行ID
		const runId = request.nextUrl.searchParams.get('id')
		if (!runId) {
			return createDifyApiResponse({ error: 'Missing run ID' }, 400)
		}

		// 代理请求到 Dify API
		const response = await proxyDifyRequest(
			app.requestConfig.apiBase,
			app.requestConfig.apiKey,
			`/workflows/run/${runId}`,
		)

		const data = await response.json()
		return createDifyApiResponse(data, response.status)
	} catch (error) {
		const resolvedParams = await params
		return handleApiError(error, `Error fetching workflow run result for ${resolvedParams.appId}`)
	}
}

/**
 * 运行工作流
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
			return new Response(JSON.stringify({ error: 'App not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// 获取请求体
		const { inputs } = await request.json()

		// 获取用户ID
		const userId = getUserIdFromRequest(request)

		// 服务端兜底：剔除非 Dify 标准的文件字段（如 originFileObj），避免触发 Type is not JSON serializable: File
		type SanitizedFile = {
			type: string
			transfer_method: 'local_file' | 'remote_url'
			upload_file_id?: string
			url?: string
		}
		const sanitizeOneFile = (item: unknown): SanitizedFile | null => {
			if (!item || typeof item !== 'object') return null
			const file = item as Record<string, unknown>
			const transfer_method =
				file.transfer_method === 'remote_url' ? 'remote_url' : 'local_file'
			const type =
				typeof file.type === 'string' && file.type ? (file.type as string) : 'document'
			if (transfer_method === 'local_file') {
				const upload_file_id =
					typeof file.upload_file_id === 'string' && file.upload_file_id
						? (file.upload_file_id as string)
						: typeof file.related_id === 'string' && file.related_id
							? (file.related_id as string)
							: ''
				if (!upload_file_id) return null
				return { type, transfer_method: 'local_file', upload_file_id }
			}
			const url =
				typeof file.url === 'string' && file.url
					? (file.url as string)
					: typeof file.remote_url === 'string'
						? (file.remote_url as string)
						: ''
			if (!url) return null
			return { type, transfer_method: 'remote_url', url }
		}
		const sanitizeFileArray = (value: unknown): SanitizedFile[] => {
			if (Array.isArray(value)) {
				return value.map(sanitizeOneFile).filter((x): x is SanitizedFile => !!x)
			}
			const single = sanitizeOneFile(value)
			return single ? [single] : []
		}
		const looksLikeFileObject = (obj: Record<string, unknown>) =>
			'upload_file_id' in obj ||
			'related_id' in obj ||
			'url' in obj ||
			'remote_url' in obj ||
			'originFileObj' in obj ||
			'transfer_method' in obj
		const sanitizedInputs: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(
			(inputs as Record<string, unknown> | undefined) || {},
		)) {
			if (Array.isArray(value)) {
				if (
					value.length > 0 &&
					value.some(item => item && typeof item === 'object') &&
					value.some(
						item =>
							item &&
							typeof item === 'object' &&
							looksLikeFileObject(item as Record<string, unknown>),
					)
				) {
					const cleaned = sanitizeFileArray(value)
					if (cleaned.length > 0) sanitizedInputs[key] = cleaned
					continue
				}
				sanitizedInputs[key] = value
				continue
			}
			if (value && typeof value === 'object') {
				const obj = value as Record<string, unknown>
				if (looksLikeFileObject(obj)) {
					const cleaned = sanitizeOneFile(obj)
					if (cleaned) sanitizedInputs[key] = cleaned
					continue
				}
			}
			sanitizedInputs[key] = value
		}
		console.log('[workflows/run proxy] normalized payload', {
			inputKeys: Object.keys(sanitizedInputs),
		})

		// 代理请求到 Dify API
		const response = await fetch(`${app.requestConfig.apiBase}/workflows/run`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${app.requestConfig.apiKey}`,
			},
			body: JSON.stringify({
				response_mode: 'streaming',
				user: userId,
				inputs: sanitizedInputs,
			}),
		})

		// 返回流式响应
		return createDifyResponseProxy(response)
	} catch (error) {
		const resolvedParams = await params
		console.error(`Error running workflow for ${resolvedParams.appId}:`, error)
		return new Response(JSON.stringify({ error: 'Failed to run workflow' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
