import { NextRequest, NextResponse } from 'next/server'

import { getAppItem } from '@/repository/app'

export const dynamic = 'force-dynamic'

type UploadLikeFile = {
	type?: string
	transfer_method?: 'local_file' | 'remote_url' | string
	upload_file_id?: string
	related_id?: string
	url?: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value)

const toUploadFile = (value: unknown): UploadLikeFile | null => {
	if (!isObject(value)) return null
	const file = value as UploadLikeFile
	const transferMethod = file.transfer_method === 'remote_url' ? 'remote_url' : 'local_file'
	if (transferMethod === 'local_file') {
		const uploadId = file.upload_file_id || file.related_id
		if (!uploadId) return null
		return {
			type: file.type || 'document',
			transfer_method: 'local_file',
			upload_file_id: uploadId,
		}
	}
	if (!file.url) return null
	return {
		type: file.type || 'document',
		transfer_method: 'remote_url',
		url: file.url,
	}
}

const normalizeInputFiles = (value: unknown) => {
	if (Array.isArray(value)) {
		return value
			.map(item => toUploadFile(item))
			.filter((item): item is UploadLikeFile => !!item)
	}
	const single = toUploadFile(value)
	return single ? [single] : []
}

const dedupeFiles = (files: UploadLikeFile[]) => {
	const seen = new Set<string>()
	return files.filter(file => {
		const key =
			file.transfer_method === 'local_file'
				? `local:${file.upload_file_id || ''}`
				: `remote:${file.url || ''}`
		if (!key || key.endsWith(':')) return true
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

const withSyllabusFilesFallback = (rawData: unknown): Record<string, unknown> => {
	if (!isObject(rawData)) return {}
	const data = { ...rawData } as Record<string, unknown>
	const inputs = isObject(data.inputs) ? ({ ...data.inputs } as Record<string, unknown>) : {}
	const currentFiles = normalizeInputFiles(data.files)
	const syllabusFiles = normalizeInputFiles(inputs.Syllabus)
	const mergedFiles = dedupeFiles([...currentFiles, ...syllabusFiles])
	data.inputs = inputs
	data.files = mergedFiles
	console.log('[chat-messages proxy] normalized payload', {
		inputKeys: Object.keys(inputs),
		syllabusCount: syllabusFiles.length,
		filesCount: mergedFiles.length,
	})
	return data
}

/**
 * 代理 Dify API 的聊天消息请求
 *
 * @param request NextRequest 对象
 * @param params 包含应用 ID 的参数对象
 * @returns 来自 Dify API 的响应
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
			return NextResponse.json({ error: 'App not found' }, { status: 404 })
		}

		// 从请求中获取数据，并做服务端文件兜底（Syllabus -> files）
		const rawData = await request.json()
		const data = withSyllabusFilesFallback(rawData)

		// 转发请求到 Dify API
		const response = await fetch(`${app.requestConfig.apiBase}/chat-messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${app.requestConfig.apiKey}`,
			},
			body: JSON.stringify(data),
		})

		// 如果是流式响应，需要特殊处理
		if (data.response_mode === 'streaming') {
			// 上游返回错误时，透传状态码和错误体，避免前端误判为 200 成功
			if (!response.ok) {
				const errorText = await response.text()
				return new Response(errorText, {
					status: response.status,
					headers: {
						'Content-Type': response.headers.get('content-type') || 'application/json',
					},
				})
			}
			if (!response.body) {
				return NextResponse.json(
					{ error: 'Dify streaming response body is empty' },
					{ status: 502 },
				)
			}

			// 创建一个新的 ReadableStream
			const stream = new ReadableStream({
				async start(controller) {
					const reader = response.body?.getReader()
					if (!reader) {
						controller.close()
						return
					}

					try {
						while (true) {
							const { done, value } = await reader.read()
							if (done) break
							controller.enqueue(value)
						}
					} finally {
						reader.releaseLock()
						controller.close()
					}
				},
			})

			// 返回流式响应，同时保留上游状态码
			return new Response(stream, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('content-type') || 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive',
				},
			})
		}

		// 非流式响应直接返回（兼容非 JSON 错误体）
		const responseText = await response.text()
		try {
			return NextResponse.json(JSON.parse(responseText), { status: response.status })
		} catch {
			return new Response(responseText, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('content-type') || 'text/plain; charset=utf-8',
				},
			})
		}
	} catch (error) {
		console.error(`Error proxying request to Dify API:`, error)
		return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
	}
}
