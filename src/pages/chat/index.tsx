import { useDifyChat } from '@dify-chat/core'
import { Empty } from 'antd'

import { Logo } from '@/components/logo'
import MultiAppLayout from '@/layout/multi-app-layout'
import SingleAppLayout from '@/layout/single-app-layout'

export default function ChatPage() {
	const { user, mode } = useDifyChat()

	// 必须先有用户, 再开始渲染布局，因为所有界面上展示的数据都需要调用 Dify API, 而所有的 Dify API 都需要用户标识
	if (!user) {
		return (
			<div className="w-screen h-screen flex flex-col items-center justify-center">
				<Logo hideGithubIcon />
				<Empty description="请先登录" />
			</div>
		)
	}

	if (mode === 'singleApp') {
		return <SingleAppLayout />
	}

	return <MultiAppLayout />
}
