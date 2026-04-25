import {
	AbstractChatProvider,
	ChatProviderConfig,
	TransformMessage,
	XRequestOptions,
} from '@ant-design/x-sdk'
import {
	EventEnum,
	IAgentThought,
	IChunkChatCompletionResponse,
	IErrorEvent,
	IFile,
	IMessageFileItem,
	IWorkflowNode,
} from '@dify-chat/api'
import { Roles } from '@dify-chat/core'
import { isTempId } from '@dify-chat/helpers'
import { message as antdMessage } from 'antd'

import { IAgentMessage } from '@/types'

import workflowDataStorage, { IWorkflowDataSetOptions } from './workflow-data-storage'

// 类型定义
export type CustomInput = {
	query: string
	conversation_id?: string
	inputs: Record<string, string>
	files: IFile[]
	user: string
	response_mode: 'streaming'
}

export type CustomOutput = {
	data: string
	event?: string
	id?: string
}

const getAppIdFromParams = () => {
	// 读取 path 的最后一段作为应用 ID
	const b = window.location.pathname.split('/')
	return b[b.length - 1]
}

interface ISetWorkflowDataOption {
	conversationId: string
	messageId: string
	value: IWorkflowDataSetOptions['value']
}

export interface CustomProviderOptions<Input, Output> {
	onTaskIdChange?: (taskId: string) => void
	onConversationIdChange?: (conversationId: string) => void
	request?: unknown
	// 占位使用，避免 TS 报错
	_ignore?: Input | Output
}

export class CustomProvider<
	ChatMessage extends IAgentMessage = IAgentMessage,
	Input extends CustomInput = CustomInput,
	Output extends CustomOutput = CustomOutput,
> extends AbstractChatProvider<ChatMessage, Input, Output> {
	private onTaskIdChange?: (taskId: string) => void
	private onConversationIdChange?: (conversationId: string) => void
	private currentTaskId?: string
	private currentConversationId?: string

	constructor(options?: CustomProviderOptions<Input, Output>) {
		super(options as unknown as ChatProviderConfig<Input, Output>)
		this.onTaskIdChange = options?.onTaskIdChange
		this.onConversationIdChange = options?.onConversationIdChange
	}

	// 处理请求参数
	transformParams(requestParams: Partial<Input>, options: XRequestOptions<Input, Output>): Input {
		console.log('params', options.params, requestParams, {
			...options.params,
			...requestParams,
			query: requestParams.query,
			conversation_id: !isTempId(requestParams.conversation_id)
				? requestParams.conversation_id
				: undefined,
		})
		return {
			...options.params,
			...requestParams,
			query: requestParams.query,
			conversation_id: !isTempId(requestParams.conversation_id)
				? requestParams.conversation_id
				: undefined,
		} as Input
	}
	transformLocalMessage(requestParams: Partial<Input>): ChatMessage {
		console.log('enter transformLocalMessage', requestParams)
		return {
			content: requestParams.query,
			role: Roles.USER,
		} as unknown as ChatMessage
	}
	private async setWorkflowDataStorage({
		conversationId,
		messageId,
		value,
	}: ISetWorkflowDataOption) {
		const appId = getAppIdFromParams()
		await workflowDataStorage.set({
			key: 'workflows',
			appId,
			conversationId,
			messageId,
			value,
		})
	}
	transformMessage(info: TransformMessage<ChatMessage, Output>): ChatMessage {
		const { originMessage, chunk } = info || {}
		const workflows = (originMessage?.workflows as NonNullable<IAgentMessage['workflows']>) || {}
		const agentThoughts: IAgentThought[] = Array.isArray(originMessage?.agentThoughts)
			? [...(originMessage.agentThoughts as IAgentThought[])]
			: []
		const files: IMessageFileItem[] = Array.isArray(originMessage?.files)
			? [...(originMessage.files as IMessageFileItem[])]
			: []
		let messageId = originMessage?.id || ''

		if (!chunk || !chunk?.data || (chunk?.data && chunk?.data?.includes('[DONE]'))) {
			return originMessage as ChatMessage
		}
		let parsedData = {} as {
			id: string
			task_id: string
			position: number
			tool: string
			tool_input: string
			observation: string
			message_files: string[]

			event: IChunkChatCompletionResponse['event']
			answer: string
			conversation_id: string
			message_id: string

			// 类型
			type: 'image'
			// 图片链接
			url: string

			data: {
				// 工作流节点的数据
				id: string
				node_type: IWorkflowNode['type']
				title: string
				inputs: Record<string, unknown>
				outputs: Record<string, unknown>
				process_data: Record<string, unknown>
				elapsed_time: number
				execution_metadata: IWorkflowNode['execution_metadata']
			}
		}
		try {
			parsedData = JSON.parse(chunk.data)
		} catch (error) {
			console.error('解析 JSON 失败', error)
			return originMessage as ChatMessage
		}
		const pickWorkflowOutputText = (data?: Record<string, unknown>) => {
			if (!data || typeof data !== 'object') return ''
			const outputs = (data as { outputs?: unknown }).outputs
			if (!outputs || typeof outputs !== 'object') return ''
			const values = Object.values(outputs as Record<string, unknown>)
			const stringValues = values
				.filter((value): value is string => typeof value === 'string' && value.trim())
				.map(value => value.trim())
			if (stringValues.length === 1) return stringValues[0]
			if (stringValues.length > 1) return stringValues.join('\n\n')
			try {
				return JSON.stringify(outputs, null, 2)
			} catch {
				return ''
			}
		}
		if (parsedData.event !== EventEnum.PING) {
			console.log('[chatflow] stream event', parsedData.event, parsedData)
		}
		if (parsedData.conversation_id && parsedData.conversation_id !== this.currentConversationId) {
			this.currentConversationId = parsedData.conversation_id
			this.onConversationIdChange?.(this.currentConversationId)
		}
		const innerData = parsedData.data
		if (parsedData.message_id && parsedData.message_id !== messageId) {
			messageId = parsedData.message_id
		}
		if (parsedData.task_id && parsedData.task_id !== this.currentTaskId) {
			this.currentTaskId = parsedData.task_id
			this.onTaskIdChange?.(this.currentTaskId)
		}
		if (parsedData.event === EventEnum.WORKFLOW_STARTED) {
			workflows.status = 'running'
			workflows.nodes = []
			this.setWorkflowDataStorage({
				conversationId: this.currentConversationId!,
				messageId,
				value: workflows,
			})
			return {
				...originMessage,
				workflows,
			} as ChatMessage
		} else if (parsedData.event === EventEnum.WORKFLOW_FINISHED) {
			console.log('工作流结束', parsedData)
			workflows.status = 'finished'
			const workflowFinishedData = (innerData || {}) as Record<string, unknown>
			const status =
				typeof workflowFinishedData.status === 'string' ? workflowFinishedData.status : ''
			const errorMsg =
				typeof workflowFinishedData.error === 'string' ? workflowFinishedData.error : ''
			const workflowText = pickWorkflowOutputText(workflowFinishedData)
			this.setWorkflowDataStorage({
				conversationId: this.currentConversationId!,
				messageId,
				value: workflows,
			})
			if (status === 'failed' || errorMsg) {
				console.error('[chatflow] workflow failed', workflowFinishedData)
				const tip = errorMsg || '工作流执行失败（无错误描述）'
				let displayTip = tip
				// 典型 Dify 工作流节点错误：节点把 File 变量直接 JSON 序列化
				if (/Type is not JSON serializable:\s*File/i.test(tip)) {
					displayTip =
						'工作流内部错误：某个节点把 Calendar/Syllabus 这类 File 变量直接 JSON 序列化了。\n' +
						'请到 Dify 控制台打开本应用，检查使用 Calendar/Syllabus 的节点（常见：Code 节点、Template 节点、Tool 入参）。\n' +
						'修复建议：\n' +
						'  • Code 节点：用 Calendar.text_content 或文档抽取工具，不要直接对 File 做 json.dumps；\n' +
						'  • Template 节点：使用 {{#Calendar.text_content#}} / {{#Calendar.url#}} 而不是 {{Calendar}}；\n' +
						'  • LLM 节点：在变量插槽里把 Calendar 作为「文件内容」引用，而不是「JSON 对象」引用；\n' +
						'  • 也可以临时执行 localStorage.setItem("IMPLICIT_REUPLOAD_DISABLED","1") 关闭隐式注入做对照实验。'
					console.warn('[chatflow] workflow failed: File JSON-serialization detected', {
						suggestion: displayTip,
					})
				}
				antdMessage.error(displayTip)
				return {
					...originMessage,
					status: 'error',
					error: displayTip,
					content: workflowText || displayTip,
					workflows,
					role: Roles.AI,
					id: messageId,
				} as unknown as ChatMessage
			}
			return {
				...originMessage,
				content: workflowText || originMessage?.content || '',
				workflows,
			} as ChatMessage
		} else if (parsedData.event === EventEnum.WORKFLOW_NODE_STARTED) {
			console.log('节点开始', parsedData)
			workflows.nodes = [
				...(workflows.nodes || []),
				{
					id: innerData.id,
					status: 'running',
					type: innerData.node_type,
					title: innerData.title,
				} as IWorkflowNode,
			]
			this.setWorkflowDataStorage({
				conversationId: this.currentConversationId!,
				messageId,
				value: workflows,
			})
			return {
				...originMessage,
				workflows,
			} as ChatMessage
		} else if (parsedData.event === EventEnum.WORKFLOW_NODE_FINISHED) {
			workflows.nodes = workflows.nodes?.map(item => {
				if (item.id === innerData.id) {
					return {
						...item,
						status: 'success',
						inputs: JSON.stringify(innerData.inputs),
						outputs: innerData.outputs,
						process_data: JSON.stringify(innerData.process_data),
						elapsed_time: innerData.elapsed_time,
						execution_metadata: innerData.execution_metadata,
					} as IWorkflowNode
				}
				return item
			})
			this.setWorkflowDataStorage({
				conversationId: this.currentConversationId!,
				messageId,
				value: workflows,
			})
			return {
				...originMessage,
				workflows,
			} as ChatMessage
		}
		if (parsedData.event === EventEnum.MESSAGE_FILE) {
			const newContent = originMessage?.content + `<img src=""${parsedData.url} />`
			return {
				...originMessage,
				content: newContent,
			} as ChatMessage
		}
		if (parsedData.event === EventEnum.MESSAGE) {
			// 当 AI 返回内容时，发一个全局广播
			window.dispatchEvent(new CustomEvent('dify-data-update', { detail: parsedData.answer }));
			return {
				...originMessage,
				taskId: this.currentTaskId,
				content: (originMessage?.content || '') + parsedData.answer,
				id: messageId,
			} as ChatMessage
		}
		if (parsedData.event === EventEnum.ERROR) {
			const err = parsedData as unknown as IErrorEvent
			const errMessage =
				err.message || `${err.status ?? ''}${err.code ? `: ${err.code}` : ''}` || 'Dify 返回错误事件'
			console.error('Dify ERROR event', err)
			antdMessage.error(errMessage)
			return {
				...originMessage,
				status: 'error',
				error: errMessage,
				role: Roles.AI,
				id: messageId,
			} as unknown as ChatMessage
		}
		if (parsedData.event === EventEnum.AGENT_MESSAGE) {
			const text = parsedData.answer || ''
			const lastAgentThought = agentThoughts[agentThoughts.length - 1]
			if (lastAgentThought && typeof lastAgentThought.thought === 'string') {
				// 将 agent_message 也同步写入最后一条 thought，便于思维链展示
				lastAgentThought.thought += text
			}

			return {
				...originMessage,
				taskId: this.currentTaskId,
				content: (originMessage?.content || '') + text,
				agentThoughts,
				id: messageId,
			} as ChatMessage
		}
		if (parsedData.event === EventEnum.AGENT_THOUGHT) {
			const existAgentThoughtIndex = agentThoughts.findIndex(
				_agentThought => _agentThought.position === parsedData.position,
			)

			const newAgentThought = {
				conversation_id: parsedData.conversation_id,
				id: parsedData.id as string,
				task_id: parsedData.task_id,
				position: parsedData.position,
				tool: parsedData.tool,
				tool_input: parsedData.tool_input,
				observation: parsedData.observation,
				message_files: parsedData.message_files,
				message_id: parsedData.message_id,
			} as IAgentThought

			if (existAgentThoughtIndex !== -1) {
				// 如果已存在一条，则替换内容
				agentThoughts[existAgentThoughtIndex] = newAgentThought
			} else {
				// 如果不存在，则插入一条
				agentThoughts.push(newAgentThought)
			}

			return {
				...originMessage,
				taskId: this.currentTaskId,
				agentThoughts,
				id: messageId,
			} as ChatMessage
		}
		console.log('parsedData', parsedData)
		return {
			...originMessage,
			taskId: this.currentTaskId,
			content: (originMessage?.content || '') + (parsedData.answer || ''),
			role: Roles.AI,
			files,
			workflows,
			agentThoughts,
			id: messageId,
		} as unknown as ChatMessage
	}
}
