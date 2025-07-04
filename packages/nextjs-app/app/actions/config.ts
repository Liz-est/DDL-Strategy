'use server'

import { getConfigByKey } from '@/config'
import { SystemConfigKeys } from '@/constants'
import { IRunningMode } from '@/types'

export const getRunningModeAction = async (): Promise<IRunningMode> => {
	const result = await getConfigByKey(SystemConfigKeys.RunningMode)
	if (result) {
		return result as IRunningMode
	}
	// 默认多应用模式
	return 'multiApp'
}
