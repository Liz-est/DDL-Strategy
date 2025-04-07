import { SettingOutlined, SwapOutlined } from '@ant-design/icons'
import { DifyApi } from '@dify-chat/api'
import { IDifyAppItem, IDifyChatContextMultiApp } from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { useMount, useRequest, useUpdateEffect } from 'ahooks'
import { Divider, Dropdown, message, Space, Tooltip } from 'antd'
import { useSearchParams } from 'pure-react-router'
import React, { useMemo, useState } from 'react'

import AppManageDrawer from '@/components/app-manage-drawer'

import BaseLayout from './base-layout'

const MultiAppLayout: React.FC = () => {
	const searchParams = useSearchParams()
	const { setCurrentAppConfig, ...difyChatContext } = useDifyChat()
	const { user, appService, enableSetting } = difyChatContext as IDifyChatContextMultiApp

	const [selectedAppId, setSelectedAppId] = useState<string>('')
	const [appManageDrawerVisible, setAppManageDrawerVisible] = useState(false)

	const {
		runAsync: getAppList,
		data: appList,
		loading: appListLoading,
	} = useRequest(
		() => {
			return appService.getApps()
		},
		{
			manual: true,
			onError: error => {
				message.error(`获取应用列表失败: ${error}`)
				console.error(error)
			},
		},
	)

	const selectedAppItem = useMemo(() => {
		return appList?.find(item => item.id === selectedAppId)
	}, [appList, selectedAppId])

	const useAppInit = (difyApi: DifyApi, callback: () => void) => {
		useUpdateEffect(() => {
			console.log('进来了吗', selectedAppId)
			const appItem = appList?.find(item => item.id === selectedAppId)
			console.log('appItem', appItem)
			if (!appItem) {
				return
			}
			difyApi.updateOptions({
				user,
				...appItem.requestConfig,
			})
			setCurrentAppConfig(appItem)
			callback()
		}, [selectedAppId])
	}

	// 初始化获取应用列表
	useMount(() => {
		getAppList().then(result => {
			const idInQuery = searchParams.get('id')
			if (idInQuery) {
				setSelectedAppId(idInQuery as string)
			} else if (!selectedAppId && result?.length) {
				setSelectedAppId(result[0]?.id || '')
			}
		})
	})

	return (
		<BaseLayout
			useAppInit={useAppInit}
			getAppConfig={() => appList?.find(item => item.id === selectedAppId) as IDifyAppItem}
			extComponents={
				<>
					<AppManageDrawer
						open={appManageDrawerVisible}
						onClose={() => setAppManageDrawerVisible(false)}
						activeAppId={selectedAppId}
						appList={appList!}
						getAppList={getAppList}
						appListLoading={appListLoading}
					/>
				</>
			}
			renderRightHeader={() => {
				return (
					<div className="flex items-center text-sm">
						<Space split={<Divider type="vertical" />}>
							{selectedAppItem ? (
								<Dropdown
									arrow
									placement="bottomRight"
									menu={{
										items: appList?.map(item => {
											const isSelected = selectedAppId === item.id
											return {
												key: item.id,
												label: (
													<div className={isSelected ? 'text-primary' : 'text-default'}>
														{isSelected ? '【当前】' : ''}
														{item.info.name}
													</div>
												),
												onClick: () => {
													setSelectedAppId(item.id)
												},
											}
										}),
									}}
								>
									<div className="flex items-center cursor-pointer">
										<div>当前应用：{selectedAppItem?.info.name}</div>
										<SwapOutlined className="cursor-pointer ml-1" />
									</div>
								</Dropdown>
							) : null}
							{enableSetting ? (
								<Tooltip title="应用配置管理">
									<SettingOutlined
										className="cursor-pointer"
										onClick={() => setAppManageDrawerVisible(true)}
									/>
								</Tooltip>
							) : null}
						</Space>
					</div>
				)
			}}
		/>
	)
}

export default MultiAppLayout
