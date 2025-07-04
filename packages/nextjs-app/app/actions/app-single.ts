'use server'

import { maskApiKey4AppConfig } from '@/app/actions/utils'
import { appConfig } from '@/services/app/singleApp'
import { IDifyAppItem } from '@/types'

export async function getAppConfig({ isMask = false }: { isMask?: boolean } = {}) {
	const result = await appConfig.getConfig()
	if (isMask && result) {
		return await maskApiKey4AppConfig(result)
	}
	return result
}

export async function setAppConfig(app: IDifyAppItem) {
	const result = await appConfig.setConfig(app)
	return result
}
