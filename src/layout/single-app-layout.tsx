import { DifyApi } from '@dify-chat/api'
import { IDifyAppItem, IDifyChatContextSingleApp } from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { useMount } from 'ahooks'
import React from 'react'

import BaseLayout from './base-layout'

const SingleAppLayout: React.FC = () => {
	const difyChatContext = useDifyChat()
	const { user, appConfig } = difyChatContext as IDifyChatContextSingleApp

	const useAppInit = (difyApi: DifyApi, callback: () => void) => {
		const initInSingleMode = async () => {
			difyApi.updateOptions({
				user,
				apiBase: (difyChatContext as IDifyChatContextSingleApp).appConfig.requestConfig.apiBase,
				apiKey: (difyChatContext as IDifyChatContextSingleApp).appConfig.requestConfig.apiKey,
			})
			callback()
		}

		// 初始化获取应用列表
		useMount(() => {
			initInSingleMode()
		})
	}

	return (
		<BaseLayout
			useAppInit={useAppInit}
			getAppConfig={() => appConfig as IDifyAppItem}
		/>
	)
}

export default SingleAppLayout
