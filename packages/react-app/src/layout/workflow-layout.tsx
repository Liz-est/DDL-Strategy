import { CopyOutlined } from '@ant-design/icons'
import { XStream } from '@ant-design/x-sdk'
import {
	EventEnum,
	IAgentMessage,
	IChunkChatCompletionResponse,
	IErrorEvent,
	IMessageFileItem,
	IWorkflowNode,
} from '@dify-chat/api'
import { AppModeEnums, useAppContext } from '@dify-chat/core'
import { copyToClipboard } from '@toolkit-fe/clipboard'
import { Button, Empty, Form, message, Tabs, Tooltip } from 'antd'
import { useState } from 'react'

import {
	AppInfo,
	AppInputForm,
	LucideIcon,
	MarkdownRenderer,
	MessageFileList,
	WorkflowLogs,
} from '@/components'
import { useAuth } from '@/hooks/use-auth'
import {
	enrichWorkflowInputsWithSyllabus,
	executeWithInputFileRetry,
	prepareInputsForDify,
} from '@/services/implicit-reupload'
import { useGlobalStore } from '@/store'

/**
 * 工作流应用详情布局
 */
export default function WorkflowLayout() {
	const { difyApi } = useGlobalStore()
	const { userId } = useAuth()
	const [entryForm] = Form.useForm()
	const { currentApp } = useAppContext()
	const [text, setText] = useState('')
	const [workflowStatus, setWorkflowStatus] = useState<'running' | 'finished'>()
	const [workflowItems, setWorkflowItems] = useState<IWorkflowNode[]>([])
	const [resultDetail, setResultDetail] = useState<Record<string, string>>({})
	const [textGenerateStatus, setTextGenerateStatus] = useState<'init' | 'running' | 'finished'>(
		'init',
	)
	const [files, setFiles] = useState<IMessageFileItem[]>([])

	const appMode = currentApp?.config?.info?.mode

	const handleTriggerWorkflow = async (values: Record<string, unknown>) => {
		if (!difyApi) {
			throw new Error('Dify API not initialized')
		}
		// workflow 仅保留 Syllabus 相关隐式再上传，避免 chatflow 字段污染工作流入参
		const workflowInputs: Record<string, unknown> = { ...values }
		if (Object.prototype.hasOwnProperty.call(workflowInputs, 'Calendar')) {
			delete workflowInputs.Calendar
		}
		let enrichedInputs: Record<string, unknown> = workflowInputs
		try {
			enrichedInputs = await enrichWorkflowInputsWithSyllabus({
				inputs: workflowInputs,
				userId,
				difyApi,
			})
		} catch (enrichError) {
			console.warn(
				'[workflow] enrichWorkflowInputsWithSyllabus failed, continue without enrichment',
				enrichError,
			)
			enrichedInputs = workflowInputs
		}
		console.log('[workflow] run body', {
			inputKeys: Object.keys(enrichedInputs || {}),
			hasSyllabus: Object.prototype.hasOwnProperty.call(enrichedInputs || {}, 'Syllabus'),
		})
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
					'[workflow] prepareInputsForDify failed, fallback to raw inputs without Syllabus',
					prepareError,
				)
				const cloned = { ...nextInputs }
				delete cloned.Syllabus
				serializableInputs = cloned
			}
			if (appMode === AppModeEnums.WORKFLOW) {
				return difyApi.runWorkflow({
					inputs: serializableInputs,
				})
			}
			if (appMode === AppModeEnums.TEXT_GENERATOR) {
				return difyApi.completion({
					inputs: serializableInputs,
				})
			}
			return Promise.reject(new Error(`不支持的应用类型: ${appMode}`))
		}

		executeWithInputFileRetry({
			inputs: enrichedInputs,
			difyApi,
			request: requestWithInputs,
			targetKeys: ['Syllabus'],
		})
			.then(({ response }) => response)
			.then(async res => {
				if (!res.ok) {
					const errorText = await res.text()
					throw new Error(errorText || 'workflow request failed')
				}
				if (!res.body) {
					throw new Error('workflow response stream is empty')
				}
				const readableStream = XStream({
					readableStream: res.body,
				})
				const reader = readableStream.getReader()
				let result = ''
				const workflows: IAgentMessage['workflows'] = {}
				while (reader) {
					const { value: chunk, done } = await reader.read()
					if (done) {
						setWorkflowStatus('finished')
						break
					}
					if (!chunk) continue
					if (chunk.data) {
						let parsedData = {} as {
							id: string
							task_id: string
							position: number
							tool: string
							tool_input: string
							observation: string
							message_files: string[]

							event: IChunkChatCompletionResponse['event'] | 'text_chunk'
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
								inputs: string
								outputs: Record<string, string>
								process_data: string
								elapsed_time: number
								execution_metadata: IWorkflowNode['execution_metadata']
								text?: string
							}
						}
						try {
							parsedData = JSON.parse(chunk.data)
						} catch (error) {
							console.error('解析 JSON 失败', error)
						}

						const innerData = parsedData.data

						if (parsedData.event === 'text_chunk') {
							setText(prev => {
								return prev + parsedData.data.text
							})
						}

						if (parsedData.event === EventEnum.WORKFLOW_STARTED) {
							workflows.status = 'running'
							workflows.nodes = []
							setWorkflowStatus('running')
							setWorkflowItems([])
						} else if (parsedData.event === EventEnum.WORKFLOW_FINISHED) {
							workflows.status = 'finished'
							const { outputs, files } = parsedData.data || {}
							const outputRecord =
								outputs && typeof outputs === 'object' ? (outputs as Record<string, string>) : {}
							const outputsLength = Object.keys(outputRecord).length
							if (outputsLength > 0) {
								setResultDetail(outputRecord)
							}
							const outputStrings = Object.values(outputRecord)
								.filter((value): value is string => typeof value === 'string' && value.trim())
								.map(value => value.trim())
							// 多 key 时也尝试聚合文本，避免有输出但“结果”Tab 空白。
							if (outputStrings.length > 0) {
								setText(outputStrings.join('\n\n'))
							}
							if (files) {
								setFiles(files)
							}
							setWorkflowStatus('finished')
						} else if (parsedData.event === EventEnum.WORKFLOW_NODE_STARTED) {
							setWorkflowItems(prev => {
								return [
									...prev,
									{
										id: innerData.id,
										status: 'running',
										type: innerData.node_type,
										title: innerData.title,
									} as IWorkflowNode,
								]
							})
						} else if (parsedData.event === EventEnum.WORKFLOW_NODE_FINISHED) {
							setWorkflowItems(prev => {
								return prev.map(item => {
									if (item.id === innerData.id) {
										return {
											...item,
											status: 'success',
											inputs: innerData.inputs,
											outputs: innerData.outputs,
											process_data: innerData.process_data,
											elapsed_time: innerData.elapsed_time,
											execution_metadata: innerData.execution_metadata,
										}
									}
									return item
								})
							})
						}
						if (parsedData.event === EventEnum.MESSAGE_FILE) {
							result += `<img src=""${parsedData.url} />`
						}
						if (parsedData.event === EventEnum.MESSAGE) {
							const text = parsedData.answer
							if (textGenerateStatus === 'init') {
								setTextGenerateStatus('running')
							}
							setText(prev => {
								return prev + text
							})
							result += text
						}
						if (parsedData.event === EventEnum.MESSAGE_END) {
							if (parsedData.event === EventEnum.MESSAGE_END) {
								setText(result)
								setTextGenerateStatus('finished')
							}
							setText(result)
						}
						if (parsedData.event === EventEnum.ERROR) {
							message.error((parsedData as unknown as IErrorEvent).message)
						}
					}
				}
			})
			.catch(err => {
				console.log('runWorkflow err', err)
				setWorkflowStatus(undefined)
			})
	}

	const resultDetailLength = Object.keys(resultDetail).length

	const resultItems = [
		{
			key: 'result',
			label: '结果',
			children: (
				<div className="h-full w-full overflow-y-auto overflow-x-hidden">
					{text ? (
						<MarkdownRenderer markdownText={text} />
					) : files ? (
						<MessageFileList files={files} />
					) : null}
				</div>
			),
			visible: text || resultDetailLength === 1,
		},
		{
			key: 'detail',
			label: '详情',
			children: (
				<div className="w-full">
					<LucideIcon
						className="cursor-pointer"
						name="copy"
						onClick={async () => {
							await copyToClipboard(JSON.stringify(resultDetail, null, 2))
							message.success('已复制到剪贴板')
						}}
					/>
					<pre className="box-border w-full overflow-auto rounded-lg bg-theme-code-block-bg p-3">
						{JSON.stringify(resultDetail, null, 2)}
					</pre>
				</div>
			),
			visible: resultDetailLength > 0,
		},
	].filter(item => item.visible)

	return (
		<div className="block h-full w-full overflow-y-auto md:flex md:items-stretch md:overflow-y-hidden">
			{/* 参数填写区域 */}
			<div className="overflow-hidden border-0 border-r border-solid border-theme-border pb-6 md:flex-1 md:pb-0">
				<div className="px-2">
					<AppInfo />
				</div>
				<div className="mt-6 px-6">
					<AppInputForm
						onStartConversation={values => {
							console.log('onStartConversation', values)
						}}
						formFilled={false}
						entryForm={entryForm}
					/>
				</div>
				<div className="flex justify-end px-6">
					<Button
						type="primary"
						onClick={async () => {
							await entryForm.validateFields()
							const values = await entryForm.getFieldsValue()
							setResultDetail({})
							setWorkflowItems([])
							setWorkflowStatus('running')
							setText('')
							handleTriggerWorkflow(values)
						}}
						loading={workflowStatus === 'running'}
					>
						运行
					</Button>
				</div>
			</div>

			{/* 工作流执行输出区域 */}
			{appMode === AppModeEnums.WORKFLOW && (
				<div className="overflow-y-auto overflow-x-hidden px-4 pt-6 md:flex-1">
					{!workflowItems?.length && workflowStatus !== 'running' ? (
						<div className="flex h-full w-full items-center justify-center">
							<Empty description={`点击 "运行" 试试看, AI 会给你带来意想不到的惊喜。 `} />
						</div>
					) : (
						<>
							<WorkflowLogs
								className="mt-0"
								status={workflowStatus}
								items={workflowItems}
							/>
							{resultItems?.length ? <Tabs items={resultItems} /> : null}
						</>
					)}
				</div>
			)}

			{/* 文本生成结果渲染 */}
			{appMode === AppModeEnums.TEXT_GENERATOR && (
				<div className="relative overflow-y-auto overflow-x-hidden bg-theme-bg px-4 pt-6 md:flex-1">
					{textGenerateStatus === 'init' ? (
						<div className="flex h-full w-full items-center justify-center">
							<Empty description={`点击 "运行" 试试看, AI 会给你带来意想不到的惊喜。 `} />
						</div>
					) : (
						<>
							<MarkdownRenderer markdownText={text} />
							<Tooltip title="复制内容">
								<CopyOutlined
									className="absolute right-6 top-6 cursor-pointer"
									onClick={async () => {
										await copyToClipboard(text)
										message.success('已复制到剪贴板')
									}}
								/>
							</Tooltip>
						</>
					)}
				</div>
			)}
		</div>
	)
}
