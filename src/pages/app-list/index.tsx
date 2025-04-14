import { IDifyChatContextMultiApp, useDifyChat } from '@dify-chat/core'
import { useRequest } from 'ahooks'
import { Button, Empty, message, Tag } from 'antd'
import { useHistory } from 'pure-react-router'
import { useEffect, useState } from 'react'

import AppManageDrawer from '@/components/app-manage-drawer'
import { MobileHeader } from '@/components/mobile/header'

export default function AppListPage() {
	const history = useHistory()
	const { appService, enableSetting, mode } = useDifyChat() as IDifyChatContextMultiApp
	const [appManageDrawerVisible, setAppManageDrawerVisible] = useState(false)

	const {
		runAsync: getAppList,
		data: list,
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

	useEffect(() => {
		if (mode === 'multiApp') {
			getAppList()
		} else {
			// FIXME: 若不加定时器，URL 会更新但是页面 UI 仍然停在当前页面
			setTimeout(() => {
				history.push('/chat')
			}, 200)
		}
	}, [])

	return (
		<div className="h-screen overflow-hidden flex flex-col">
			<MobileHeader centerChildren={<>应用列表</>} />
			<div className="px-3 flex-1 overflow-auto">
				{list?.length ? (
					list.map(item => {
						return (
							<div
								key={item.id}
								className={`p-3 bg-white mt-3 border border-solid border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:text-primary`}
								onClick={() => {
									history.push(`/chat/${item.id}`)
								}}
							>
								<div className="w-full flex items-center truncate font-semibold">
									{item.info.name}
								</div>
								<div className="truncate text-sm mt-2 text-desc">{item.info.description}</div>

								<div className="flex-1 overflow-hidden flex flex-wrap items-center">
									{item.info.tags
										? item.info.tags.map(tag => {
												return (
													<Tag
														key={tag}
														className="mr-2 mt-2"
													>
														{tag}
													</Tag>
												)
											})
										: null}
								</div>
							</div>
						)
					})
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center">
						<Empty description="暂无应用" />
					</div>
				)}
			</div>
			{enableSetting ? (
				<div className="p-3">
					<Button
						size="large"
						block
						type="primary"
						onClick={() => {
							setAppManageDrawerVisible(true)
						}}
					>
						应用配置管理
					</Button>
				</div>
			) : null}

			<AppManageDrawer
				open={appManageDrawerVisible}
				onClose={() => setAppManageDrawerVisible(false)}
				activeAppId=""
				appList={list!}
				getAppList={getAppList}
				appListLoading={appListLoading}
			/>
		</div>
	)
}
