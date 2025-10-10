import { FileJpgOutlined, FileTextOutlined } from '@ant-design/icons'
import { DifyApi, IMessageFileItem } from '@dify-chat/api'
import { useAppContext } from '@dify-chat/core'
import { useMemo } from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

import { completeFileUrl } from '@/utils'

import { formatSize } from '../../message-sender/utils'

const triggerDownload = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename || 'download'
	document.body.appendChild(a)
	a.click()
	a.remove()
	URL.revokeObjectURL(url)
}

/**
 * 从 Content-Disposition 头中解析文件名
 * @param contentDisposition Content-Disposition 头值
 * @param fallback  fallback 文件名
 * @returns 解析后的文件名
 */
const parseFilenameFromCD = (contentDisposition: string | null, fallback: string) => {
	if (!contentDisposition) return fallback
	// 从 Content-Disposition 头中解析文件名
	// e.g. attachment; filename="example.pdf"
	const match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i)
	const encoded = match?.[1]
	const plain = match?.[2]
	try {
		if (encoded) return decodeURIComponent(encoded)
		if (plain) return plain
	} catch (error) {
		console.warn(`解析文件名失败: ${error}`, contentDisposition)
	}
	return fallback
}

interface IMessageFileListProps {
	/**
	 * 文件预览 API 函数
	 */
	previewApi: DifyApi['filePreview']
	/**
	 * 消息附件列表
	 */
	files?: IMessageFileItem[]
}

/**
 * 消息附件列表展示组件
 */
export default function MessageFileList(props: IMessageFileListProps) {
	const { previewApi, files: filesInProps } = props
	const { currentApp } = useAppContext()

	/**
	 * 处理文件 URL, 如果是本地文件则补全
	 */
	const files = useMemo(() => {
		const appApiBase = currentApp?.config.requestConfig.apiBase || ''
		return (
			filesInProps?.map(item => {
				const newUrl = completeFileUrl(item.url, appApiBase)
				return {
					...item,
					url: newUrl,
				}
			}) || []
		)
	}, [filesInProps, currentApp])

	if (!filesInProps?.length) {
		return null
	}

	const isAllImages = files.every(item => item.type === 'image' && item.url)

	// 如果所有文件都是图片，则直接展示图片列表
	if (isAllImages) {
		return (
			<div className="flex flex-wrap">
				{files.map((item: IMessageFileItem) => {
					return (
						<PhotoProvider key={item.id}>
							<PhotoView src={item.url}>
								<img
									src={item.url}
									key={item.id}
									alt={item.filename}
									className="w-24 h-24 cursor-zoom-in mr-2 rounded-lg"
									style={{
										objectFit: 'cover',
									}}
								/>
							</PhotoView>
						</PhotoProvider>
					)
				})}
			</div>
		)
	}

	// 如果存在非图片文件，则展示文件列表
	return (
		<>
			{files.map((item: IMessageFileItem) => {
				return (
					<a
						title="点击下载文件"
						target="_blank"
						rel="noreferrer"
						key={item.id}
						className="p-3 bg-gray-50 rounded-lg w-60 flex items-center cursor-pointer no-underline mb-2"
						onClick={async e => {
							e.preventDefault()
							try {
								const result = await previewApi({
									file_id: item.upload_file_id as string,
									as_attachment: true,
								})

								// Case 1: API returns a fetch Response
								if (typeof Response !== 'undefined' && result instanceof Response) {
									const cd = result.headers?.get?.('content-disposition') || null
									const filename = parseFilenameFromCD(cd, item.filename)
									const blob = await result.blob()
									triggerDownload(blob, filename)
									return
								}
								console.warn('预览接口返回格式错误，无法下载', result)
							} catch (err) {
								console.error('下载失败', err)
							}
						}}
					>
						{item.type === 'image' ? (
							<FileJpgOutlined className="text-3xl text-gray-400 mr-2" />
						) : (
							<FileTextOutlined className="text-3xl text-gray-400 mr-2" />
						)}
						<div className="overflow-hidden">
							<div className="text-theme-text truncate">{item.filename}</div>
							{item.size ? <div className="text-desc truncate">{formatSize(item.size)}</div> : null}
						</div>
					</a>
				)
			})}
		</>
	)
}
