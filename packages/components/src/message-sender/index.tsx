import { CloudUploadOutlined, LinkOutlined } from '@ant-design/icons'
import { Attachments, AttachmentsProps, Sender } from '@ant-design/x'
import { IFile, IGetAppParametersResponse, IUploadFileResponse } from '@dify-chat/api'
import { Badge, Button, GetProp, GetRef, message } from 'antd'
import { RcFile } from 'antd/es/upload'
import { useMemo, useRef, useState } from 'react'

import { FileTypeMap, getFileExtByName, getFileTypeByName } from './utils'

interface IMessageSenderProps {
	/**
	 * Dify 应用参数
	 */
	appParameters?: IGetAppParametersResponse
	/**
	 * 类名
	 */
	className?: string
	/**
	 * 当前输出的文字
	 */
	content: string
	/**
	 * 是否正在请求
	 */
	isRequesting: boolean
	/**
	 * 上传文件 Api
	 */
	uploadFileApi: (file: File) => Promise<IUploadFileResponse>
	/**
	 * 输入框 change 事件
	 */
	onChange: (value: string) => void
	/**
	 * 提交事件
	 */
	onSubmit: (value: string, files?: IFile[]) => void
	/**
	 * 取消事件
	 */
	onCancel: () => void
}

/**
 * 用户消息发送区
 */
export const MessageSender = (props: IMessageSenderProps) => {
	const {
		content,
		isRequesting,
		onChange,
		onSubmit,
		className,
		onCancel,
		uploadFileApi,
		appParameters,
	} = props
	const [open, setOpen] = useState(false)
	const [files, setFiles] = useState<GetProp<AttachmentsProps, 'items'>>([])
	const [fileIdMap, setFileIdMap] = useState<Map<string, string>>(new Map())

	const allowedFileTypes = useMemo(() => {
		if (!appParameters?.file_upload) {
			return []
		}
		const result: string[] = []
		appParameters.file_upload.allowed_file_types.forEach(item => {
			if (FileTypeMap.get(item)) {
				result.push(...((FileTypeMap.get(item) as string[]) || []))
			}
		})
		return result
	}, [appParameters?.file_upload])

	const handleUpload = async (file: RcFile) => {
		const prevFiles = [...files]

		const fileBaseInfo: GetProp<AttachmentsProps, 'items'>[number] = {
			uid: file.uid,
			name: file.name,
			status: 'uploading',
			size: file.size,
			type: file.type,
			originFileObj: file,
		}

		// 模拟上传进度
		const mockLoadingProgress = () => {
			let percent = 0
			setFiles([
				...prevFiles,
				{
					...fileBaseInfo,
					percent: percent,
				},
			])
			const interval = setInterval(() => {
				if (percent >= 99) {
					clearInterval(interval)
					return
				}
				percent = percent + 1
				setFiles([
					...prevFiles,
					{
						...fileBaseInfo,
						percent,
					},
				])
			}, 100)
			return {
				clear: () => clearInterval(interval),
			}
		}
		const { clear } = mockLoadingProgress()

		const result = await uploadFileApi(file)
		clear()
		setFiles([
			...prevFiles,
			{
				...fileBaseInfo,
				percent: 100,
				status: 'done',
			},
		])
		setFileIdMap(prevMap => {
			const nextMap = new Map(prevMap)
			nextMap.set(file.uid, result.id)
			return nextMap
		})
	}

	const senderRef = useRef<GetRef<typeof Sender>>(null)
	const senderHeader = (
		<Sender.Header
			title="上传文件"
			open={open}
			onOpenChange={setOpen}
			styles={{
				content: {
					padding: 0,
				},
			}}
		>
			<Attachments
				beforeUpload={async file => {
					// 校验文件类型
					// 自定义上传

					const ext = getFileExtByName(file.name)
					// 校验文件类型
					if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(ext!)) {
						message.error(`不支持的文件类型: ${ext}`)
						return false
					}

					handleUpload(file)
					return false
				}}
				items={files}
				placeholder={type =>
					type === 'drop'
						? {
								title: 'Drop file here',
							}
						: {
								icon: <CloudUploadOutlined />,
								title: '点击或拖拽文件到此区域上传',
								description: (
									<div>
										支持的文件类型：
										{allowedFileTypes.join(', ')}
									</div>
								),
							}
				}
				getDropContainer={() => senderRef.current?.nativeElement}
				onRemove={file => {
					setFiles(prev => {
						return prev.filter(item => {
							return item.uid !== file.uid
						})
					})
				}}
			/>
		</Sender.Header>
	)

	return (
		<Sender
			header={senderHeader}
			value={content}
			onChange={onChange}
			prefix={
				<Badge dot={files.length > 0 && !open}>
					<Button
						onClick={() => setOpen(!open)}
						icon={<LinkOutlined />}
					/>
				</Badge>
			}
			style={{
				boxShadow: '0px -2px 12px 4px #efefef',
			}}
			loading={isRequesting}
			className={className}
			onSubmit={async content => {
				console.log('files', files)
				// 当文件存在时，判断是否所有文件都已上传完成
				if (files?.length && !files.every(item => item.status === 'done')) {
					message.error('请等待所有文件上传完成')
					return
				}
				await onSubmit(
					content,
					files?.map(file => {
						const fileType = getFileTypeByName(file.name)
						return {
							type: fileType || 'document',
							transfer_method: 'local_file',
							upload_file_id: fileIdMap.get(file.uid) as string,
						}
					}) || [],
				)
				setFiles([])
				setOpen(false)
			}}
			onCancel={onCancel}
		/>
	)
}
