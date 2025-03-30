import { WarningOutlined } from '@ant-design/icons'
import { IFile, IMessageItem4Render } from '@dify-chat/api'

import { MarkdownRenderer } from '../../markdown-renderer'
import ThoughtChain from '../thought-chain'
import MessageFileList from './file-list'
import MessageReferrence from './referrence'
import WorkflowLogs from './workflow-logs'

interface IMessageContentProps {
	/**
	 * 提交消息时触发的回调函数
	 * @param nextContent 下一条消息的内容
	 * @param files 附件文件列表
	 */
	onSubmit?: (nextContent: string, files?: IFile[]) => void
	/**
	 * 消息数据对象
	 */
	messageItem: IMessageItem4Render
}

/**
 * 消息内容展示组件
 */
export default function MessageContent(props: IMessageContentProps) {
	const {
		onSubmit,
		messageItem: {
			id,
			status,
			error,
			agentThoughts,
			workflows,
			files,
			content,
			retrieverResources,
			role,
		},
	} = props

	// 如果是错误状态，则直接展示错误信息
	if (status === 'error') {
		return (
			<p className="text-red-700">
				<WarningOutlined className="mr-2" />
				<span>{error}</span>
			</p>
		)
	}

	return (
		<>
			{/* Agent 思维链信息 */}
			<ThoughtChain
				uniqueKey={id as string}
				items={agentThoughts}
				className="mt-3"
			/>

			{/* 工作流执行日志 */}
			<WorkflowLogs
				items={workflows?.nodes || []}
				status={workflows?.status}
			/>

			{/* 消息附件列表 */}
			{files?.length ? (
				<div className="mt-3">
					<MessageFileList files={files} />
				</div>
			) : null}

			{/* 消息主体文本内容 */}
			<div className={role === 'local' || role === 'user' ? '' : 'md:min-w-chat-card'}>
				<MarkdownRenderer
					markdownText={content}
					onSubmit={onSubmit}
				/>
			</div>

			{/* 引用链接列表 */}
			<MessageReferrence items={retrieverResources} />
		</>
	)
}
