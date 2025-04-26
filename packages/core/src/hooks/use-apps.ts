import React, { useContext } from 'react'

import { IDifyAppItem } from '../repository'
import { IDifyAppParameters } from '../types'

export interface ICurrentApp {
	config: IDifyAppItem
	parameters: IDifyAppParameters
}

export interface IAppContext {
	appLoading?: boolean
	currentAppId?: string
	setCurrentAppId: (appId: string) => void
	currentApp?: ICurrentApp
	setCurrentApp: (app: ICurrentApp) => void
}

const DEFAULT_APP_CONTEXT: IAppContext = {
	currentAppId: '',
	setCurrentAppId: () => {},
	appLoading: false,
	currentApp: {
		config: {
			id: '',
			info: {
				name: '',
				description: '',
				tags: [],
			},
			requestConfig: {
				apiBase: '',
				apiKey: '',
			},
		},
		parameters: {
			opening_statement: '',
			user_input_form: [],
			suggested_questions: [],
			suggested_questions_after_answer: {
				enabled: false,
			},
			file_upload: {
				enabled: false,
				allowed_file_extensions: [],
				allowed_file_types: [],
				allowed_file_upload_methods: [],
				number_limits: 1,
				image: {
					enabled: false,
					number_limits: 3,
					transfer_methods: ['local_file', 'remote_url'],
				},
				fileUploadConfig: {
					file_size_limit: 0,
					batch_count_limit: 0,
					image_file_size_limit: 0,
					video_file_size_limit: 0,
					audio_file_size_limit: 0,
					workflow_file_upload_limit: 0,
				},
			},
			text_to_speech: {
				enabled: false,
				autoPlay: 'enabled',
				language: '',
				voice: '',
			},
			speech_to_text: {
				enabled: false,
			},
		},
	},
	setCurrentApp: () => {},
}

export const AppContext = React.createContext<IAppContext>(DEFAULT_APP_CONTEXT)

export const AppContextProvider = AppContext.Provider

/**
 * 获取应用上下文
 */
export const useAppContext = () => {
	return useContext(AppContext)
}
