import { DownCircleTwoTone, RobotFilled } from '@ant-design/icons'
import { DifyApi } from '@dify-chat/api'
import { IDifyAppItem, IDifyChatContextMultiApp } from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { useIsMobile } from '@dify-chat/helpers'
import { useMount, useRequest, useUpdateEffect } from 'ahooks'
import { Dropdown, message } from 'antd'
import { useHistory, useSearchParams } from 'pure-react-router'
import React, { useMemo, useState } from 'react'

import AppManageDrawer from '@/components/app-manage-drawer'

import BaseLayout from './base-layout'

const MultiAppLayout: React.FC = () => {
	const searchParams = useSearchParams()
	const { setCurrentAppConfig, ...difyChatContext } = useDifyChat()
	const { user, appService, enableSetting } = difyChatContext as IDifyChatContextMultiApp
	const history = useHistory()

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
			onSuccess: result => {
				const idInQuery = searchParams.get('id')

				if (isMobile) {
					// 移动端如果没有应用，直接跳转应用列表页
					if (!result?.length) {
						history.replace('/apps')
						return Promise.resolve([])
					}
				}

				if (idInQuery) {
					setSelectedAppId(idInQuery as string)
				} else if (!selectedAppId && result?.length) {
					setSelectedAppId(result[0]?.id || '')
				}
			},
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
			const appItem = appList?.find(item => item.id === selectedAppId)
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

	const isMobile = useIsMobile()

	// 初始化获取应用列表
	useMount(() => {
		getAppList()
	})

	return (
		<BaseLayout
			useAppInit={useAppInit}
			appConfig={appList?.find(item => item.id === selectedAppId) as IDifyAppItem}
			handleStartConfig={() => {
				if (enableSetting) {
					setAppManageDrawerVisible(true)
				}
			}}
			extComponents={
				<>
					<AppManageDrawer
						open={appManageDrawerVisible}
						onClose={() => setAppManageDrawerVisible(false)}
						activeAppId={selectedAppId}
						appList={appList!}
						getAppList={getAppList}
						appListLoading={appListLoading}
						onDeleteSuccess={(deletedId: string) => {
							if (deletedId === selectedAppId) {
								setSelectedAppId('')
							}
						}}
					/>
				</>
			}
			renderCenterTitle={() => {
				return (
					<>
						<RobotFilled className="mr-2" />
						<span
							className="cursor-pointer"
							onClick={() => {
								if (enableSetting) {
									setAppManageDrawerVisible(true)
								}
							}}
						>
							应用列表
						</span>
						{selectedAppId ? (
							<>
								<div className="mx-2 font-normal text-desc">/</div>
								<Dropdown
									arrow
									placement="bottomCenter"
									trigger={['click']}
									menu={{
										style: {
											// boxShadow: 'none',
										},
										selectedKeys: [selectedAppId],
										items: [
											...(appList?.map(item => {
												const isSelected = selectedAppId === item.id
												return {
													key: item.id,
													label: (
														<div className={isSelected ? 'text-primary' : 'text-default'}>
															{item.info.name}
														</div>
													),
													onClick: () => {
														setSelectedAppId(item.id)
													},
													icon: <RobotFilled />,
												}
											}) || []),
										],
									}}
								>
									<div className="cursor-pointer">
										<span className="cursor-pointer">{selectedAppItem?.info?.name}</span>
										<DownCircleTwoTone className="ml-1" />
									</div>
								</Dropdown>
							</>
						) : null}
					</>
				)
			}}
		/>
	)
}

export default MultiAppLayout
