'use client'

import { DeleteOutlined, EditOutlined, MoreOutlined, SyncOutlined } from '@ant-design/icons'
import { IDifyAppItem } from '@dify-chat/core'
import { useRequest } from 'ahooks'
import { Dropdown, message, Modal } from 'antd'

import { getUserAction } from '@/app/actions'
import { deleteApp, getAppItem, updateApp } from '@/app/apps/actions'
import { AppDetailDrawerModeEnum } from '@/app/apps/enums'
import { useAppEditDrawer } from '@/app/apps/hooks/use-app-edit-drawer'
import { useDifyApi } from '@/hooks/useApi'

export default function AppItemActionButton(props: {
	item: IDifyAppItem
	refreshAppList: () => Promise<void>
}) {
	const { item, refreshAppList } = props
	const { setAppEditDrawerMode, setAppEditDrawerOpen, setAppEditDrawerAppItem, drawerComponent } =
		useAppEditDrawer({
			successCallback: () => refreshAppList(),
		})
	const { data: userInfo } = useRequest(() => {
		return getUserAction()
	})
	const difyApi = useDifyApi({
		user: userInfo?.userId as string,
		appId: item.id!,
	})
	return (
		<>
			<Dropdown
				menu={{
					items: [
						{
							key: 'sync',
							icon: <SyncOutlined />,
							label: '同步 Dify 应用信息',
							onClick: () => {
								Modal.confirm({
									title: '同步 Dify 应用信息',
									content: '确定要同步 Dify 应用信息吗？',
									onOk: async () => {
										const appItem = await getAppItem(item.id)
										if (!appItem) {
											message.error('应用不存在')
											return
										}
										const { info: originalInfo, ...rest } = appItem!
										const appInfo = await difyApi.getAppInfo()
										try {
											await updateApp({
												...rest,
												info: {
													...originalInfo,
													...appInfo,
												},
											})
											message.success('同步应用成功')
											refreshAppList()
										} catch (error) {
											message.error('同步应用失败')
											console.error(error)
										}
									},
								})
							},
						},
						{
							key: 'edit',
							icon: <EditOutlined />,
							label: '编辑',
							onClick: async () => {
								// 获取 app 详情
								const app = await getAppItem(item.id)
								setAppEditDrawerMode(AppDetailDrawerModeEnum.edit)
								setAppEditDrawerOpen(true)
								setAppEditDrawerAppItem(app)
							},
						},
						{
							key: 'delete',
							icon: <DeleteOutlined />,
							label: '删除',
							danger: true,
							onClick: async () => {
								await deleteApp(item.id)
								message.success('删除应用成功')
								// 重新加载列表页
								refreshAppList()
							},
						},
					],
				}}
			>
				<MoreOutlined className="absolute right-3 top-3 text-lg" />
			</Dropdown>
			{drawerComponent}
		</>
	)
}
