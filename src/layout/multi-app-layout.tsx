import { DownCircleTwoTone, RobotFilled } from '@ant-design/icons'
import { DifyApi } from '@dify-chat/api'
import { IDifyAppItem, IDifyChatContextMultiApp } from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { useIsMobile } from '@dify-chat/helpers'
import { useMount, useRequest } from 'ahooks'
import { Dropdown, message, Spin } from 'antd'
import { useHistory, useParams } from 'pure-react-router'
import React, { useEffect, useMemo, useState } from 'react'

import AppManageDrawer from '@/components/app-manage-drawer'

import BaseLayout from './base-layout'

const MultiAppLayout: React.FC = () => {
	const { setCurrentAppConfig, ...difyChatContext } = useDifyChat()
	const { user, appService, enableSetting } = difyChatContext as IDifyChatContextMultiApp
	const history = useHistory()

	const [selectedAppId, setSelectedAppId] = useState<string>('')
	const [appManageDrawerVisible, setAppManageDrawerVisible] = useState(false)
	const [initLoading, setInitLoading] = useState(false)

	const { appId } = useParams<{ appId: string }>()

	useEffect(() => {
		setSelectedAppId(appId)
	}, [appId])

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
				if (isMobile) {
					// 移动端如果没有应用，直接跳转应用列表页
					if (!result?.length) {
						history.replace('/apps')
						return Promise.resolve([])
					}
				}

				if (appId) {
					setSelectedAppId(appId as string)
				} else if (!selectedAppId && result?.length) {
					setSelectedAppId(result[0]?.id || '')
				}
				setInitLoading(false)
			},
			onError: error => {
				message.error(`获取应用列表失败: ${error}`)
				console.error(error)
				setInitLoading(false)
			},
		},
	)

	const selectedAppItem = useMemo(() => {
		return appList?.find(item => item.id === selectedAppId)
	}, [appList, selectedAppId])

	const useAppInit = (difyApi: DifyApi, callback: () => void) => {
		useEffect(() => {
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

	if (initLoading) {
		return (
			<div className="absolute w-full h-full left-0 top-0 z-50 flex items-center justify-center">
				<Spin spinning />
			</div>
		)
	}

	return selectedAppItem ? (
		<BaseLayout
			useAppInit={useAppInit}
			appConfig={selectedAppItem as IDifyAppItem}
			initLoading={initLoading}
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
								// if (enableSetting) {
								// 	setAppManageDrawerVisible(true)
								// }
								history.push('/apps')
							}}
						>
							应用列表
						</span>
						{selectedAppId ? (
							<>
								<div className="mx-2 font-normal text-desc">/</div>
								<Dropdown
									arrow
									placement="bottom"
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
														history.push(`/app/${item.id}`)
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
	) : null
}

export default MultiAppLayout
