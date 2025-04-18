import { IDifyChatContextMultiApp, useDifyChat } from '@dify-chat/core'
import { useIsMobile } from '@dify-chat/helpers'
import { useRequest } from 'ahooks'
import { Button, Col, Empty, message, Row, Tag } from 'antd'
import { useHistory } from 'pure-react-router'
import { useEffect, useState } from 'react'

import AppManageDrawer from '@/components/app-manage-drawer'
import { MobileHeader } from '@/components/mobile/header'

export default function AppListPage() {
	const history = useHistory()
	const { appService, enableSetting, mode } = useDifyChat() as IDifyChatContextMultiApp
	const [appManageDrawerVisible, setAppManageDrawerVisible] = useState(false)
	const isMobile = useIsMobile()

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
			<div className="px-3 md:px-44 flex-1 overflow-auto">
				{list?.length ? (
					<Row gutter={isMobile ? 0 : 12}>
						{list.map(item => {
							return (
								<Col
									key={item.id}
									span={isMobile ? 24 : 8}
								>
									<div
										key={item.id}
										className={`p-3 bg-white mt-3 border border-solid border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:text-primary`}
										onClick={() => {
											history.push(`/app/${item.id}`)
										}}
									>
										<div className="w-full flex items-center truncate font-semibold">
											{item.info.name}
										</div>
										<div className="truncate text-sm mt-2 text-desc h-8 leading-8">
											{item.info.description}
										</div>

										<div className="overflow-auto flex items-center md:h-14">
											{item.info.tags
												? item.info.tags.map(tag => {
														return (
															<Tag
																key={tag}
																className="mr-2 mt-2 shrink-0"
															>
																{tag}
															</Tag>
														)
													})
												: null}
										</div>
									</div>
								</Col>
							)
						})}
					</Row>
				) : (
					<div className="w-full h-full flex flex-col items-center justify-center">
						<Empty description="暂无应用" />
					</div>
				)}
			</div>
			{enableSetting ? (
				<div className="p-3 md:mx-44">
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
