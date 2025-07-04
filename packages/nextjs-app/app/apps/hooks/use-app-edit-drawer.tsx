import { IDifyAppItem } from '@dify-chat/core'
import { useState } from 'react'

import { AppEditDrawer } from '@/app/apps/components/app-edit-drawer'
import { AppDetailDrawerModeEnum } from '@/app/apps/enums'

import { createApp, updateApp } from '../actions'

export const useAppEditDrawer = (callbacks?: { successCallback?: () => void }) => {
	const [appEditDrawerMode, setAppEditDrawerMode] = useState<AppDetailDrawerModeEnum>()
	const [appEditDrawerOpen, setAppEditDrawerOpen] = useState(false)
	const [appEditDrawerAppItem, setAppEditDrawerAppItem] = useState<IDifyAppItem>()

	const drawerComponent = (
		<AppEditDrawer
			addApi={createApp}
			updateApi={updateApp}
			detailDrawerMode={appEditDrawerMode!}
			open={appEditDrawerOpen}
			onClose={() => setAppEditDrawerOpen(false)}
			appItem={appEditDrawerAppItem}
			confirmCallback={() => {
				// TODO 调用应用列表接口刷新数据
				// getAppList();
				callbacks?.successCallback?.()
			}}
		/>
	)

	return {
		drawerComponent,
		appEditDrawerMode,
		setAppEditDrawerMode,
		appEditDrawerOpen,
		setAppEditDrawerOpen,
		appEditDrawerAppItem,
		setAppEditDrawerAppItem,
	}
}
