import { HeaderLayout } from '@dify-chat/components'
import { AppModeEnums, AppModeNames } from '@dify-chat/core'
import { useMount, useRequest } from 'ahooks'
import { Button, message, Segmented, Space, Table, Tag } from 'antd'
import { useHistory } from 'pure-react-router'

import { appService } from '@/services/app/multiApp'

const TopMenuOptions = [
	{ label: '应用管理', value: 'app-management', route: '/admin/app-management' },
	{ label: '系统配置', value: 'system-config', route: '/admin/system-config' },
]

export default function AppManagementPage() {
	const history = useHistory()

	const {
		runAsync: getAppList,
		data: list,
		loading: listLoading,
	} = useRequest(
		() => {
			return appService.getApps()
		},
		{
			manual: true,
			onSuccess: res => {
				console.log('appList', res)
			},
			onError: error => {
				message.error(`获取应用列表失败: ${error}`)
				console.error(error)
			},
		},
	)

	useMount(() => {
		getAppList()
	})

	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			<HeaderLayout
				title={
					<Segmented
						options={TopMenuOptions}
						onChange={key => {
							const route = TopMenuOptions.find(item => item.value === key)?.route
							if (route) {
								history.push(route)
							}
						}}
					/>
				}
			/>
			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden flex items-center">
				<div className="flex-1 h-full overflow-auto px-6">
					<Table
						dataSource={list}
						loading={listLoading}
						columns={[
							{
								title: '名称',
								dataIndex: 'info.name',
								key: 'info.name',
								width: 180,
								ellipsis: true,
								render: (_text, record) => {
									return record.info.name
								},
							},
							{
								title: '类型',
								dataIndex: 'info.mode',
								key: 'info.mode',
								width: 200,
								render: (_mode: AppModeEnums, record) => {
									return record.info.mode
										? AppModeNames[(record.info.mode || AppModeEnums.CHATBOT) as AppModeEnums]
										: '--'
								},
							},
							{
								title: '描述',
								dataIndex: 'info.description',
								key: 'info.description',
								width: 300,
								ellipsis: true,
								render: (_text, record) => {
									return record.info.description || '暂无描述'
								},
							},
							{
								title: '标签',
								dataIndex: 'info.tags',
								key: 'info.tags',
								width: 200,
								render: (_text, record) => {
									return record.info.tags?.length ? (
										<Space>
											{record.info.tags.map((tag: string) => (
												<Tag key={`${record.id}__${tag}`}>{tag}</Tag>
											))}
										</Space>
									) : null
								},
							},
							{
								title: '操作',
								key: 'action',
								width: 120,
								render: _ => (
									<Space size="middle">
										<Button
											className="!px-0"
											type="link"
										>
											编辑
										</Button>
										<Button
											className="!px-0"
											type="link"
											danger
										>
											删除
										</Button>
									</Space>
								),
							},
						]}
					/>
				</div>
			</div>
		</div>
	)
}
