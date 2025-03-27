import { CopyOutlined } from '@ant-design/icons'
import { copyToClipboard } from '@toolkit-fe/clipboard'
import { message } from 'antd'

interface IWorkflowNodeDetailProps {
	title: string
	/**
	 * 原始结构化内容
	 */
	originalContent: string
}

export default function WorkflowNodeDetail(props: IWorkflowNodeDetailProps) {
	const { title, originalContent } = props

	return (
		<div className="mb-2">
			{title}：
			{originalContent ? (
				<>
					<CopyOutlined
						className="cursor-pointer"
						onClick={async () => {
							await copyToClipboard(JSON.stringify(originalContent, null, 2))
							message.success('复制成功')
						}}
					/>
					<pre className="w-full overflow-auto m-0">{JSON.stringify(originalContent, null, 2)}</pre>
				</>
			) : (
				<pre>空</pre>
			)}
		</div>
	)
}
