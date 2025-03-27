import { FileTextOutlined } from '@ant-design/icons'
import { IMessageFileItem } from '@dify-chat/api'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

import { formatSize } from '../../message-sender/utils'

interface IMessageFileListProps {
	/**
	 * 消息附件列表
	 */
	files?: IMessageFileItem[]
}

/**
 * 消息附件列表展示组件
 */
export default function MessageFileList(props: IMessageFileListProps) {
	const { files } = props

	if (!files?.length) {
		return null
	}

	return (
		<>
			{files.map((item: IMessageFileItem) => {
				if (item.type === 'image') {
					return (
						<PhotoProvider key={item.id}>
							<PhotoView src={item.url}>
								<img
									src={item.url}
									key={item.id}
									alt={item.filename}
									className="max-w-full cursor-zoom-in"
								/>
							</PhotoView>
						</PhotoProvider>
					)
				}
				return (
					<a
						title="点击下载文件"
						href={item.url}
						target="_blank"
						rel="noreferrer"
						key={item.id}
						className="p-3 bg-gray-50 rounded-lg w-60 flex items-center cursor-pointer no-underline"
					>
						<FileTextOutlined className="text-3xl text-gray-400 mr-2" />
						<div className="overflow-hidden">
							<div className="text-default truncate">{item.filename}</div>
							<div className="text-desc truncate">{formatSize(item.size)}</div>
						</div>
					</a>
				)
			})}
		</>
	)
}
