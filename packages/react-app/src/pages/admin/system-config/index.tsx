import { Tabs } from 'antd'

import AdminPageLayout from '../components/admin-page-layout'

const tabItems = [
	{
		label: '全局参数配置',
		key: 'system',
	},
	{
		label: '主题配置',
		key: 'theme',
	},
]

export default function SystemConfigPage() {
	return (
		<AdminPageLayout>
			<div className="flex-1 h-full overflow-auto px-6">
				<div className="flex items-center">
					<Tabs items={tabItems} />
				</div>
			</div>
		</AdminPageLayout>
	)
}
