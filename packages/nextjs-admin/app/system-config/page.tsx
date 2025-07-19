'use client'

import { DatabaseOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import { Card, Statistic } from 'antd'
import Title from 'antd/es/typography/Title'

import { getDatabaseStatus } from './actions'

export default function SystemConfigPage() {
	const { data: status, loading } = useRequest(() => getDatabaseStatus(), {
		onError: error => {
			console.error('获取数据库状态失败:', error)
		},
	})

	return (
		<div className="flex-1 h-full overflow-auto px-6">
			<div className="mb-6">
				<Title level={3}>系统配置</Title>
			</div>

			<Card
				title={
					<div className="flex items-center">
						<DatabaseOutlined className="mr-2" />
						数据库状态
					</div>
				}
				loading={loading}
			>
				{status && (
					<Statistic
						title="应用总数"
						value={status.totalApps}
						prefix={<DatabaseOutlined />}
					/>
				)}
			</Card>
		</div>
	)
}
