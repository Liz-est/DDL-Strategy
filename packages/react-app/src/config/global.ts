import { IDifyChatMode } from '@dify-chat/core'

let runningMode: IDifyChatMode = 'multiApp'

class DifyChatRuntimeConfig {
	init = (mode: IDifyChatMode) => {
		runningMode = mode
	}

	get = () => {
		return {
			runningMode,
		}
	}
}

export const difyChatRuntimeConfig = new DifyChatRuntimeConfig()
