import { DifyApp } from '@prisma/client'

import { AppModeEnums, IDifyAppItem } from '@/types'

/**
 * 将数据库模型转换为应用类型
 */
export function dbAppToAppItem(dbApp: DifyApp): IDifyAppItem {
	return {
		id: dbApp.id,
		info: {
			name: dbApp.name,
			mode: dbApp.mode as AppModeEnums | undefined,
			description: dbApp.description || '',
			tags: dbApp.tags ? JSON.parse(dbApp.tags) : [],
		},
		requestConfig: {
			apiBase: dbApp.apiBase,
			apiKey: dbApp.apiKey,
		},
		answerForm: dbApp.answerFormEnabled
			? {
					enabled: dbApp.answerFormEnabled,
					feedbackText: dbApp.answerFormFeedbackText,
				}
			: undefined,
		inputParams: {
			enableUpdateAfterCvstStarts: dbApp.inputParamsEnableUpdateAfterCvstStarts,
			parameters: dbApp.inputParamsParameters ? JSON.parse(dbApp.inputParamsParameters) : [],
		},
		extConfig: dbApp.extConfigConversationOpeningStatementDisplayMode
			? {
					conversation: {
						openingStatement: {
							displayMode: dbApp.extConfigConversationOpeningStatementDisplayMode as
								| 'default'
								| 'always',
						},
					},
				}
			: undefined,
	}
}

/**
 * 将应用类型转换为数据库模型数据
 */
export function appItemToDbApp(
	appItem: Omit<IDifyAppItem, 'id'>,
): Omit<DifyApp, 'id' | 'createdAt' | 'updatedAt'> {
	return {
		name: appItem.info.name,
		mode: appItem.info.mode || null,
		description: appItem.info.description || null,
		tags: appItem.info.tags.length > 0 ? JSON.stringify(appItem.info.tags) : null,
		apiBase: appItem.requestConfig.apiBase,
		apiKey: appItem.requestConfig.apiKey,
		answerFormEnabled: appItem.answerForm?.enabled || false,
		answerFormFeedbackText: appItem.answerForm?.feedbackText || null,
		inputParamsEnableUpdateAfterCvstStarts:
			appItem.inputParams?.enableUpdateAfterCvstStarts || false,
		inputParamsParameters: appItem.inputParams?.parameters
			? JSON.stringify(appItem.inputParams.parameters)
			: null,
		extConfigConversationOpeningStatementDisplayMode:
			appItem.extConfig?.conversation?.openingStatement?.displayMode || null,
	}
}

/**
 * 将应用类型转换为数据库更新数据
 */
export function appItemToDbAppUpdate(
	appItem: IDifyAppItem,
): Omit<DifyApp, 'createdAt' | 'updatedAt'> {
	return {
		id: appItem.id,
		...appItemToDbApp(appItem),
	}
}
