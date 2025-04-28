import { UploadOutlined } from '@ant-design/icons'
import { DifyApi, IGetAppParametersResponse } from '@dify-chat/api'
import { Button, GetProp, message, Upload } from 'antd'
import { RcFile, UploadFile } from 'antd/es/upload'
import { useEffect, useMemo, useState } from 'react'

import { FileTypeMap, getFileExtByName, getFileTypeByName } from '../../message-sender/utils'

interface IFileUploadCommonProps {
	allowed_file_types: IGetAppParametersResponse['file_upload']['allowed_file_types']
	uploadFileApi: DifyApi['uploadFile']
	disabled?: boolean
	maxCount: number
}

interface IFileUploadSingleProps extends IFileUploadCommonProps {
	value?: UploadFile
	onChange?: (file: UploadFile) => void
	mode: 'single'
}

interface IFileUploadMultipleProps extends IFileUploadCommonProps {
	value?: UploadFile[]
	onChange?: (files: UploadFile[]) => void
	mode: 'multiple'
}

type IFileUploadProps = IFileUploadSingleProps | IFileUploadMultipleProps

export default function FileUpload(props: IFileUploadProps) {
	const {
		mode = 'multiple',
		maxCount,
		disabled,
		allowed_file_types,
		uploadFileApi,
		value,
		onChange,
	} = props
	const [files, setFiles] = useState<GetProp<typeof Upload, 'fileList'>>([])

	useEffect(() => {
		if (mode === 'single') {
			setFiles(value ? [value as UploadFile] : [])
		} else {
			const multiModeValues = value as UploadFile[] | undefined
			if (multiModeValues?.length && multiModeValues?.length !== files.length) {
				setFiles(multiModeValues)
			}
		}
	}, [value])

	const formatFiles = (files: UploadFile[]) => {
		return files?.map(file => {
			const fileType = getFileTypeByName(file.name)
			return {
				...file,
				type: fileType,
			}
		})
	}

	const updateFiles = (newFiles: UploadFile[]) => {
		console.log('updateFiles', newFiles)
		const formattedNewFiles = formatFiles(newFiles)
		const newFilesState = mode === 'single' ? formattedNewFiles : [...files, ...formattedNewFiles]
		setFiles(newFilesState)
		console.log('触发 onChange', formattedNewFiles)
		if (mode === 'single') {
			onChange?.(newFilesState[0] as UploadFile)
		} else {
			onChange?.(newFilesState as UploadFile[])
		}
	}

	const allowedFileTypes = useMemo(() => {
		const result: string[] = []
		allowed_file_types?.forEach(item => {
			if (FileTypeMap.get(item)) {
				result.push(...((FileTypeMap.get(item) as string[]) || []))
			}
		})
		return result
	}, [allowed_file_types])

	const handleUpload = async (file: RcFile) => {
		const prevFiles = [...files]
		console.log('handleUpload', prevFiles)

		const fileBaseInfo: GetProp<typeof Upload, 'fileList'>[number] = {
			uid: file.uid,
			name: file.name,
			status: 'uploading',
			size: file.size,
			type: file.type,
			originFileObj: file,
			transfer_method: 'local_file',
			// upload_file_id: fileIdMap.get(file.uid) as string,
		}

		// 模拟上传进度
		const mockLoadingProgress = () => {
			let percent = 0
			updateFiles([
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
				updateFiles([
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
		const fileType = getFileTypeByName(file.name)
		updateFiles([
			{
				...fileBaseInfo,
				upload_file_id: result.id,
				type: fileType || 'document',
				percent: 100,
				status: 'done',
			},
		])
	}

	return (
		<Upload
			maxCount={mode === 'single' ? 1 : maxCount}
			disabled={disabled}
			fileList={files}
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
		>
			<Button icon={<UploadOutlined />}>Click to Upload</Button>
		</Upload>
	)
}
