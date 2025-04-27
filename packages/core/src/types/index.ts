/**
 * Dify 支持的文件类型
 */
export type IFileType = 'document' | 'image' | 'audio' | 'video' | 'custom'

/**
 * 用户输入表单控件类型
 */
export type IUserInputFormItemType =
	| 'text-input'
	| 'paragraph'
	| 'select'
	| 'number'
	| 'file'
	| 'file-list'

/**
 * 用户输入表单控件对象
 */
export interface IUserInputFormItemValueBase {
	default: string
	label: string
	required: boolean
	variable: string
	options?: string[]
	/**
	 * 最大长度
	 */
	max_length?: number
	type: IUserInputFormItemType
}

/**
 * 应用输入配置
 */
export type IUserInputForm = Record<IUserInputFormItemType, IUserInputFormItemValueBase>

export interface IDifyAppParameters {
	/**
	 * 开场白
	 */
	opening_statement?: string
	/**
	 * 用户输入表单
	 */
	user_input_form: IUserInputForm[]
	/**
	 * 开场建议问题
	 */
	suggested_questions?: string[]
	/**
	 * 下一轮问题建议
	 */
	suggested_questions_after_answer: {
		/**
		 * 是否启用
		 */
		enabled: boolean
	}
	/**
	 * 文件上传参数
	 */
	file_upload: {
		/**
		 * 是否允许上传文件
		 */
		enabled: boolean
		/**
		 * 允许上传的文件后缀名
		 */
		allowed_file_extensions: string[]
		/**
		 * 允许上传的文件类型
		 */
		allowed_file_types: IFileType[]
		/**
		 * 允许的上传方式 - remote_url-远程地址 local_file-本地文件
		 */
		allowed_file_upload_methods: Array<'remote_url' | 'local_file'>
		/**
		 * 文件上传配置
		 */
		fileUploadConfig: {
			/**
			 * 文件大小限制（单位：MB）
			 */
			file_size_limit: number
			/**
			 * 批量上传文件数量限制
			 */
			batch_count_limit: number
			/**
			 * 图片文件大小限制（单位：MB）
			 */
			image_file_size_limit: number
			/**
			 * 视频文件大小限制（单位：MB）
			 */
			video_file_size_limit: number
			/**
			 * 音频文件大小限制（单位：MB）
			 */
			audio_file_size_limit: number
			/**
			 * 工作流文件上传限制（单位：MB）
			 */
			workflow_file_upload_limit: number
		}
		/**
		 * 图片上传配置
		 */
		image: {
			/**
			 * 是否启用图片上传
			 */
			enabled: false
			/**
			 * 允许上传的图片最大数量
			 */
			number_limits: 3
			/**
			 * 允许的上传方式 - remote_url-远程地址 local_file-本地文件
			 */
			transfer_methods: ['local_file', 'remote_url']
		}
		/**
		 * 允许上传的文件数量
		 */
		number_limits: number
	}
	/**
	 * 文本转语音配置
	 */
	text_to_speech: {
		/**
		 * 是否启用
		 */
		enabled: boolean
		/**
		 * 是否开启自动播放 enabled-启用 disabled-禁用
		 */
		autoPlay: 'enabled' | 'disabled'
		/**
		 * 语言
		 */
		language: string
		/**
		 * 音色
		 */
		voice: string
	}
	/**
	 * 语音转文本配置
	 */
	speech_to_text: {
		/**
		 * 是否启用
		 */
		enabled: boolean
	}
}
