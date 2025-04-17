import { UnorderedListOutlined } from '@ant-design/icons'
import { Prompts } from '@ant-design/x'
import {
	DifyApi,
	IFile,
	IGetAppInfoResponse,
	IGetAppParametersResponse,
	IMessageFileItem,
} from '@dify-chat/api'
import { IMessageItem4Render } from '@dify-chat/api'
import { Chatbox, ConversationList } from '@dify-chat/components'
import { IDifyAppItem } from '@dify-chat/core'
import { useConversationsContext } from '@dify-chat/core'
import { isTempId, useIsMobile } from '@dify-chat/helpers'
import { Button, Empty, Form, GetProp, Popover, Spin } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_CONVERSATION_NAME } from '@/constants'
import { useLatest } from '@/hooks/use-latest'
import { useX } from '@/hooks/useX'
import workflowDataStorage from '@/hooks/useX/workflow-data-storage'

import { MobileHeader } from './mobile/header'

interface IChatboxWrapperProps {
	/**
	 * 应用信息
	 */
	appInfo?: IGetAppInfoResponse
	/**
	 * 应用参数
	 */
	appParameters?: IGetAppParametersResponse
	/**
	 * Dify 应用配置
	 */
	appConfig?: IDifyAppItem
	/**
	 * Dify API 实例
	 */
	difyApi: DifyApi
	/**
	 * 对话列表 loading
	 */
	conversationListLoading?: boolean
	/**
	 * 内部处理对话列表变更的函数
	 */
	conversationItemsChangeCallback: () => void
	/**
	 * 添加对话
	 */
	onAddConversation: () => void
	/**
	 * 应用配置加载中
	 */
	appConfigLoading?: boolean
	/**
	 * 触发配置应用事件
	 */
	handleStartConfig?: () => void
}

/**
 * 聊天容器 进入此组件时, 应保证应用信息和对话列表已经加载完成
 */
export default function ChatboxWrapper(props: IChatboxWrapperProps) {
	const {
		appConfig,
		appInfo,
		appParameters,
		difyApi,
		conversationListLoading,
		onAddConversation,
		conversationItemsChangeCallback,
		appConfigLoading,
		handleStartConfig,
	} = props
	const {
		currentConversationId,
		setCurrentConversationId,
		conversations,
		setConversations,
		currentConversationInfo,
	} = useConversationsContext()

	const [entryForm] = Form.useForm()
	const isMobile = useIsMobile()
	const abortRef = useRef(() => {})
	useEffect(() => {
		return () => {
			abortRef.current()
		}
	}, [])
	const [initLoading, setInitLoading] = useState<boolean>(false)
	const [historyMessages, setHistoryMessages] = useState<IMessageItem4Render[]>([])

	const [nextSuggestions, setNextSuggestions] = useState<string[]>([])
	// 定义 ref, 用于获取最新的 conversationId
	const latestProps = useLatest({
		conversationId: currentConversationId,
		appId: appConfig?.id,
	})
	const latestState = useLatest({
		inputParams: currentConversationInfo?.inputs || {},
	})

	const filesRef = useRef<IFile[]>([])

	/**
	 * 获取下一轮问题建议
	 */
	const getNextSuggestions = async (message_id: string) => {
		const result = await difyApi.getNextSuggestions({ message_id })
		setNextSuggestions(result.data)
	}

	const updateConversationInputs = (formValues: Record<string, unknown>) => {
		setConversations(prev => {
			console.log(
				'setConversations: updateConversationInputs',
				prev.map(item => {
					if (item.id === currentConversationId) {
						return {
							...item,
							inputs: formValues,
						}
					}
					return item
				}),
			)
			return prev.map(item => {
				if (item.id === currentConversationId) {
					return {
						...item,
						inputs: formValues,
					}
				}
				return item
			})
		})
	}

	/**
	 * 获取对话的历史消息
	 */
	const getConversationMessages = async (conversationId: string) => {
		// 如果是临时 ID，则不获取历史消息
		if (isTempId(conversationId)) {
			return
		}
		const result = await difyApi.getConversationHistory(conversationId)

		if (!result?.data?.length) {
			return
		}

		const newMessages: IMessageItem4Render[] = []

		// 只有当历史消息中的参数不为空时才更新
		if (result?.data?.length && Object.values(result.data?.[0]?.inputs)?.length) {
			updateConversationInputs(result.data[0]?.inputs || {})
		}

		result.data.forEach(item => {
			const createdAt = dayjs(item.created_at * 1000).format('YYYY-MM-DD HH:mm:ss')
			newMessages.push(
				{
					id: item.id,
					content: item.query,
					status: 'success',
					isHistory: true,
					files: item.message_files,
					role: 'user',
					created_at: createdAt,
				},
				{
					id: item.id,
					content: item.answer,
					status: item.status === 'error' ? item.status : 'success',
					error: item.error || '',
					isHistory: true,
					feedback: item.feedback,
					workflows:
						workflowDataStorage.get({
							appId: appConfig?.id || '',
							conversationId,
							messageId: item.id,
							key: 'workflows',
						}) || [],
					agentThoughts: item.agent_thoughts || [],
					retrieverResources: item.retriever_resources || [],
					role: 'ai',
					created_at: createdAt,
				},
			)
		})

		setMessages([])
		setHistoryMessages(newMessages)
		if (newMessages?.length) {
			// 如果下一步问题建议已开启，则请求接口获取
			if (appParameters?.suggested_questions_after_answer.enabled) {
				getNextSuggestions(newMessages[newMessages.length - 1].id)
			}
		}
	}

	const { agent, onRequest, messages, setMessages, currentTaskId } = useX({
		latestProps,
		latestState,
		filesRef,
		getNextSuggestions,
		appParameters,
		abortRef,
		getConversationMessages,
		onConversationIdChange: id => {
			console.log('setCurrentConversationId: agent', id)
			setCurrentConversationId(id)
			if (id !== latestProps.current.conversationId) {
				conversationItemsChangeCallback()
			}
		},
		difyApi,
	})

	const initConversationInfo = async () => {
		// 有对话 ID 且非临时 ID 时，获取历史消息
		if (currentConversationId && !isTempId(currentConversationId)) {
			await getConversationMessages(currentConversationId)
			setInitLoading(false)
		} else {
			// 不管有没有参数，都结束 loading，开始展示内容
			setInitLoading(false)
		}
	}

	useEffect(() => {
		setInitLoading(true)
		setMessages([])
		setHistoryMessages([])
		initConversationInfo()
	}, [currentConversationId])

	const onPromptsItemClick: GetProp<typeof Prompts, 'onItemClick'> = info => {
		onRequest({
			content: info.data.description as string,
		})
	}

	const isFormFilled = useMemo(() => {
		if (!appParameters?.user_input_form?.length) {
			return true
		}
		return appParameters.user_input_form.every(item => {
			const fieldInfo = Object.values(item)[0]
			return !!currentConversationInfo?.inputs?.[fieldInfo.variable]
		})
	}, [appParameters, currentConversationInfo])

	const onSubmit = (
		nextContent: string,
		options?: { files?: IFile[]; inputs?: Record<string, unknown> },
	) => {
		filesRef.current = options?.files || []
		onRequest({
			content: nextContent,
			files: options?.files as IMessageFileItem[],
		})
	}

	const unStoredMessages4Render = useMemo(() => {
		return messages.map(item => {
			return {
				id: item.id,
				status: item.status,
				// @ts-expect-error TODO: 类型待优化
				error: item.message.error || '',
				workflows: item.message.workflows,
				agentThoughts: item.message.agentThoughts,
				retrieverResources: item.message.retrieverResources,
				files: item.message.files,
				content: item.message.content,
				role: item.status === 'local' ? 'user' : 'ai',
			} as IMessageItem4Render
		})
	}, [messages])

	const conversationTitle = (
		<Popover
			trigger={['click']}
			content={
				<div className="w-60">
					<div className="text-base font-semibold">对话列表</div>
					<Spin spinning={conversationListLoading}>
						{conversations?.length ? (
							<ConversationList
								renameConversationPromise={async (conversationId: string, name: string) => {
									await difyApi?.renameConversation({
										conversation_id: conversationId,
										name,
									})
									conversationItemsChangeCallback()
								}}
								deleteConversationPromise={async (conversationId: string) => {
									if (isTempId(conversationId)) {
										setConversations(prev => {
											const newConversations = prev.filter(item => item.id !== conversationId)
											if (conversationId === currentConversationId && newConversations.length) {
												setCurrentConversationId(newConversations[0].id)
											}
											return newConversations
										})
									} else {
										await difyApi?.deleteConversation(conversationId)
										conversationItemsChangeCallback()
										return Promise.resolve()
									}
								}}
								items={conversations.map(item => {
									return {
										key: item.id,
										label: item.name,
									}
								})}
								activeKey={currentConversationId}
								onActiveChange={setCurrentConversationId}
							/>
						) : (
							<Empty description="暂无会话" />
						)}
					</Spin>
					<Button
						className="mt-3"
						onClick={onAddConversation}
						block
						type="primary"
					>
						新增对话
					</Button>
				</div>
			}
			placement={isMobile ? 'bottom' : 'bottomLeft'}
		>
			<div className="inline-flex items-center">
				<UnorderedListOutlined className="mr-3 cursor-pointer" />
				<span>{currentConversationInfo?.name || DEFAULT_CONVERSATION_NAME}</span>
			</div>
		</Popover>
	)

	// 如果应用配置 / 对话列表加载中，则展示 loading
	if (conversationListLoading || appConfigLoading) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<Spin spinning />
			</div>
		)
	}

	if (!appConfig) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<Empty description="请先配置 Dify 应用">
					<Button
						type="primary"
						onClick={handleStartConfig}
					>
						开始配置
					</Button>
				</Empty>
			</div>
		)
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden flex-1">
			{isMobile ? <MobileHeader centerChildren={conversationTitle} /> : null}

			<div className="flex-1 overflow-hidden relative">
				{initLoading ? (
					<div className="absolute w-full h-full left-0 top-0 z-50 flex items-center justify-center">
						<Spin spinning />
					</div>
				) : null}

				{currentConversationId ? (
					<Chatbox
						appInfo={appInfo}
						appConfig={appConfig!}
						conversationId={currentConversationId!}
						appParameters={appParameters}
						nextSuggestions={nextSuggestions}
						messageItems={[...historyMessages, ...unStoredMessages4Render]}
						isRequesting={agent.isRequesting()}
						onPromptsItemClick={onPromptsItemClick}
						onSubmit={onSubmit}
						onCancel={async () => {
							abortRef.current()
							if (currentTaskId) {
								await difyApi.stopTask(currentTaskId)
								getConversationMessages(currentConversationId!)
							}
						}}
						isFormFilled={isFormFilled}
						onStartConversation={formValues => {
							updateConversationInputs(formValues)

							if (!currentConversationId) {
								onAddConversation()
							}
						}}
						feedbackApi={difyApi.feedbackMessage}
						feedbackCallback={(conversationId: string) => {
							// 反馈成功后，重新获取历史消息
							getConversationMessages(conversationId)
						}}
						uploadFileApi={difyApi.uploadFile}
						difyApi={difyApi}
						entryForm={entryForm}
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<Spin spinning />
					</div>
				)}
			</div>
		</div>
	)
}
