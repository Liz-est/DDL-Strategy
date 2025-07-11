import { AppModeEnums, AppModeNames } from '@dify-chat/core'
import { useMount, useRequest } from 'ahooks'
import { Button, Space, Table, Tag } from 'antd'

import { appService } from '@/services/app/multiApp'

import AdminPageLayout from '../components/admin-page-layout'

export default function AppManagementPage() {
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
		},
	)

	useMount(() => {
		getAppList()
	})

	return (
		<AdminPageLayout>
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
		</AdminPageLayout>
	)
}
