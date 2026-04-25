// import { useXAgent, useXChat, XStream } from '@ant-design/x'
import { useXChat, XRequest } from '@ant-design/x-sdk'
import { IFile } from '@dify-chat/api'
import { Roles } from '@dify-chat/core'
import { isTempId } from '@dify-chat/helpers'
import { FormInstance } from 'antd'
import { useEffect, useRef, useState } from 'react'

import { RESPONSE_MODE } from '@/config'
import {
	enrichChatflowInputsWithSyllabus,
	executeWithInputFileRetry,
	mergeConversationAndFormInputs,
	prepareInputsForDify,
} from '@/services/implicit-reupload'
import { IAgentMessage } from '@/types'
import { DifyApi } from '@/utils/dify-api'

import { useAuth } from '../use-auth'
import { CustomInput, CustomOutput, CustomProvider } from './x-provider'

interface IUseXOptions {
	latestProps: React.MutableRefObject<{
		conversationId: string | undefined
		appId?: string
		difyApi?: DifyApi
		storedInputs?: Record<string, unknown>
	}>
	entryForm: FormInstance<Record<string, unknown>>
	filesRef: React.MutableRefObject<IFile[]>
	onConversationIdChange: (id: string) => void
	onTaskIdChange: (id: string) => void
	abortRef: React.MutableRefObject<() => void>
	getNextSuggestions: (messageId: string) => void
}

export const useX = (options: IUseXOptions) => {
	const {
		latestProps,
		filesRef,
		onTaskIdChange,
		entryForm,
		getNextSuggestions,
		onConversationIdChange,
	} = options

	const { userId: user } = useAuth()
	const onConversationIdChangeRef = useRef(onConversationIdChange)
	onConversationIdChangeRef.current = onConversationIdChange

	const onTaskIdChangeRef = useRef(onTaskIdChange)
	onTaskIdChangeRef.current = onTaskIdChange

	const [provider] = useState(
		new CustomProvider({
			onTaskIdChange: (id: string) => {
				onTaskIdChangeRef.current(id)
			},
			onConversationIdChange: (id: string) => {
				onConversationIdChangeRef.current(id)
			},
			request: XRequest<CustomInput, CustomOutput>(
				// 这个参数没有意义，只是为了符合传参规范
				'dify-chat-messages',
				{
					manual: true,
					fetch: async (_, options) => {
						const body = options?.body ? JSON.parse(options.body as string) : {}
						const difyApi = latestProps.current.difyApi
						if (!difyApi) {
							throw new Error('Dify API not initialized')
						}

						const currentInputs = entryForm.getFieldsValue() || {}
						const currentFiles = filesRef.current || []
						const mergedInputs = mergeConversationAndFormInputs(
							latestProps.current.storedInputs || {},
							currentInputs,
						)
						// chatflow 改为统一使用 Syllabus 承载“用户上传 + 隐式再上传”
						const chatflowInputs: Record<string, unknown> = { ...mergedInputs }
						if (Object.prototype.hasOwnProperty.call(chatflowInputs, 'Calendar')) {
							delete chatflowInputs.Calendar
						}
						let enrichedInputs: Record<string, unknown> = mergedInputs
						try {
							enrichedInputs = await enrichChatflowInputsWithSyllabus({
								inputs: chatflowInputs,
								userId: user,
								difyApi,
							})
						} catch (enrichError) {
							console.warn(
								'[chatflow] enrichChatflowInputsWithSyllabus failed, continue without enrichment',
								enrichError,
							)
							enrichedInputs = chatflowInputs
						}

						body.inputs = enrichedInputs
						body.files = currentFiles
						const { conversationId } = latestProps.current
						if (!body.conversation_id && conversationId && !isTempId(conversationId)) {
							body.conversation_id = conversationId
						}
						if (body.conversation_id && isTempId(body.conversation_id)) {
							body.conversation_id = undefined
						}

						const requestWithInputs = async (nextInputs: Record<string, unknown>) => {
							let serializableInputs: Record<string, unknown> = nextInputs
							try {
								serializableInputs = await prepareInputsForDify({
									inputs: nextInputs,
									targetKeys: ['Syllabus'],
									difyApi,
									forceLocalFile: true,
								})
							} catch (prepareError) {
								console.warn(
									'[chatflow] prepareInputsForDify failed, fallback to raw inputs without Syllabus',
									prepareError,
								)
								const cloned = { ...nextInputs }
								delete cloned.Syllabus
								serializableInputs = cloned
							}
							const toInputFiles = (value: unknown): IFile[] => {
								const pickOne = (item: unknown): IFile | null => {
									if (!item || typeof item !== 'object') return null
									const file = item as Record<string, unknown>
									const transfer_method =
										file.transfer_method === 'remote_url' ? 'remote_url' : 'local_file'
									if (transfer_method === 'local_file') {
										const upload_file_id =
											typeof file.upload_file_id === 'string'
												? file.upload_file_id
												: typeof file.related_id === 'string'
													? file.related_id
													: ''
										if (!upload_file_id) return null
										return {
											type: (typeof file.type === 'string' ? file.type : 'document') as IFile['type'],
											transfer_method: 'local_file',
											upload_file_id,
										}
									}
									const url = typeof file.url === 'string' ? file.url : ''
									if (!url) return null
									return {
										type: (typeof file.type === 'string' ? file.type : 'document') as IFile['type'],
										transfer_method: 'remote_url',
										url,
									}
								}
								if (Array.isArray(value)) {
									return value
										.map(item => pickOne(item))
										.filter((item): item is IFile => !!item)
								}
								const single = pickOne(value)
								return single ? [single] : []
							}
							const syllabusFiles = toInputFiles(serializableInputs.Syllabus)
							const mergedFiles = [...(currentFiles || []), ...syllabusFiles]
							const dedupedFiles = mergedFiles.filter((file, index, arr) => {
								const key =
									file.transfer_method === 'local_file'
										? file.upload_file_id || ''
										: file.url || ''
								if (!key) return true
								return arr.findIndex(other => {
									const otherKey =
										other.transfer_method === 'local_file'
											? other.upload_file_id || ''
											: other.url || ''
									return otherKey === key
								}) === index
							})
							console.log('[chatflow] serializable Syllabus', serializableInputs.Syllabus)
							console.log('[chatflow] outbound files', dedupedFiles)
							return difyApi.sendMessage({
								...body,
								inputs: serializableInputs,
								files: dedupedFiles,
							})
						}

						console.log('[chatflow] sendMessage body', {
							query: body.query,
							conversation_id: body.conversation_id,
							inputKeys: Object.keys(enrichedInputs || {}),
							hasSyllabus: Object.prototype.hasOwnProperty.call(enrichedInputs || {}, 'Syllabus'),
							files: Array.isArray(currentFiles) ? currentFiles.length : 0,
							syllabusShape: Array.isArray(enrichedInputs?.Syllabus)
								? 'array'
								: typeof enrichedInputs?.Syllabus,
						})
						const result = await executeWithInputFileRetry({
							inputs: enrichedInputs,
							difyApi,
							request: requestWithInputs,
							targetKeys: ['Syllabus'],
						})
						if (!result.response?.ok) {
							const errText = await result.response?.clone().text().catch(() => '')
							console.error('[chatflow] sendMessage non-ok response', result.response?.status, errText)
						}
						return result.response
					},
					params: {
						// 这里传入空对象是为了满足类型要求，实际请求时会在 fetch 中获取最新值
						inputs: {},
						files: filesRef.current || [],
						user,
						response_mode: RESPONSE_MODE,
						query: '',
					},
					callbacks: {
						onSuccess: messages => {
							console.log('onSuccess', messages)
							try {
								const first = Array.isArray(messages) && messages.length > 0 ? messages[0] : null
								console.log('[chatflow] onSuccess:first', {
									status: first?.status,
									role: first?.message?.role,
									content: first?.message?.content,
									error: first?.message?.error,
									workflows: first?.message?.workflows,
								})
							} catch (e) {
								console.warn('[chatflow] onSuccess debug log failed', e)
							}
							// setMessages(messages)
						},
						onError: error => {
							console.error('onError', error)
						},
						onUpdate: msg => {
							console.log('onUpdate', msg)
						},
					},
				},
			),
		}),
	)

	const { abort, onRequest, messages, setMessages, isRequesting } = useXChat({
		provider,
		requestPlaceholder: {
			role: Roles.AI,
			content: '正在回复，请耐心等待...',
		},
		requestFallback: {
			role: Roles.AI,
			content: 'Request failed, Please try again later.',
		},
	})

	const wasRequesting = useRef(false)

	useEffect(() => {
		if (wasRequesting.current && !isRequesting) {
			const lastMessage = messages[messages.length - 1] as unknown as IAgentMessage
			if (lastMessage?.role === Roles.AI && lastMessage?.id) {
				getNextSuggestions(String(lastMessage.id))
			}
		}
		wasRequesting.current = isRequesting
	}, [isRequesting, messages, getNextSuggestions])

	return {
		onRequest,
		messages,
		setMessages,
		abort,
		isRequesting,
	}
}
