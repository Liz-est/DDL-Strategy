import {
	AimOutlined,
	ArrowRightOutlined,
	FieldNumberOutlined,
	FileOutlined,
	IeOutlined,
} from '@ant-design/icons'
import { IRetrieverResource } from '@dify-chat/api'
import { Popover, Space, Tooltip } from 'antd'

const ReferenceItem = (props: IRetrieverResource) => {
	return (
		<div
			className="text-gray-600 flex items-center"
			title={props.document_name}
		>
			<Popover
				trigger={['click']}
				classNames={{
					root: 'max-w-[400px]',
				}}
				title={
					<div className="flex items-center justify-between">
						<div className="flex items-center">
							<span>{props.document_name}</span>
							<span className="text-desc ml-2">#{props.segment_position}</span>
						</div>
						<a
							target="_blank"
							rel="noreferrer"
							href={`https://cloud.dify.ai/datasets/${props.dataset_id}/documents/${props.document_id}`}
						>
							跳转到知识库 <ArrowRightOutlined className="ml-2" />
						</a>
					</div>
				}
				placement="topLeft"
				content={
					<>
						<div>{props.content}</div>
						<div className="flex items-center text-desc mt-2">
							{/* TODO: 补充字符数量、向量哈希、召回得分 */}
							<Space>
								<Tooltip
									title={`召回次数: ${props.hit_count}`}
									arrow={false}
								>
									<div>
										<AimOutlined />
										<span className="ml-1">{props.hit_count}</span>
									</div>
								</Tooltip>

								<Tooltip
									title={`召回得分: ${props.score}`}
									arrow={false}
								>
									<div>
										<FieldNumberOutlined />
										<span className="ml-1">{props.score}</span>
									</div>
								</Tooltip>
							</Space>
						</div>
					</>
				}
			>
				{props.data_source_type === 'website_crawl' ? (
					<IeOutlined />
				) : props.data_source_type === 'upload_file' ? (
					<FileOutlined />
				) : null}
				<span className="ml-1.5 cursor-pointer hover:underline">{props.document_name}</span>
			</Popover>
		</div>
	)
}

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
						<ReferenceItem {...item} />
					</div>
				)
			})}
		</div>
	)
}
