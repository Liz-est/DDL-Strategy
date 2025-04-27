import { UploadOutlined } from "@ant-design/icons";
import { Button, GetProp, message, Upload } from "antd";
import { FileTypeMap, getFileExtByName, getFileTypeByName } from "../../message-sender/utils";
import { useEffect, useMemo, useState } from "react";
import { DifyApi, IGetAppParametersResponse } from "@dify-chat/api";
import { RcFile, UploadFile } from "antd/es/upload";

interface IFileUploadProps {
	value?: UploadFile[]
	onChange?: (files: UploadFile[]) => void;
	allowed_file_types: IGetAppParametersResponse['file_upload']['allowed_file_types']
	uploadFileApi: DifyApi['uploadFile']
}

export default function FileUpload(props: IFileUploadProps) {

	const { allowed_file_types, uploadFileApi, value, onChange } = props
	const [files, setFiles] = useState<GetProp<typeof Upload, 'fileList'>>([])
	const [fileIdMap, setFileIdMap] = useState<Map<string, string>>(new Map())

	useEffect(()=>{
		if (value?.length) {
			setFiles(value)
		}
	}, [value])

	console.log('files', files, 'value', value)

	const updateFiles = (files: RcFile[]) => {
		console.log('updateFiles', files)
		setFiles(files)
		onChange?.(files)
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
				updateFiles([
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
		const fileType = getFileTypeByName(file.name)
		updateFiles([
			...prevFiles,
			{
				...fileBaseInfo,
				upload_file_id: result.id,
				type: fileType || 'document',
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

	return (
		<Upload beforeUpload={async file => {
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
		}}>
			<Button icon={<UploadOutlined />}>Click to Upload</Button>
		</Upload>
	)
}
