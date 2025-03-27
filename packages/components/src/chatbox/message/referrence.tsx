import { IRetrieverResource } from '@dify-chat/api'

interface IMessageReferrenceProps {
	/**
	 * 消息引用链接列表
	 */
	items?: IRetrieverResource[]
}

/**
 * 消息引用链接列表
 */
export default function MessageReferrence(props: IMessageReferrenceProps) {
	const { items } = props

	if (!items?.length) {
		return null
	}

	return (
		<div className="pb-3">
			<div className="flex items-center text-gray-400">
				<span className="mr-3 text-sm">引用</span>
				<div className="flex-1 border-gray-400 border-dashed border-0 border-t h-0" />
			</div>
			{items.map(item => {
				return (
					<div
						className="mt-2 truncate"
						key={item.id}
					>
						<a
							className="text-gray-600"
							target="_blank"
							rel="noreferrer"
							href={item.document_name}
							title={item.document_name}
						>
							{item.document_name}
						</a>
					</div>
				)
			})}
		</div>
	)
}
