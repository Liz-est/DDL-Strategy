'use client'

import { Spin } from 'antd'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
	const { data: session, status } = useSession()
	const router = useRouter()

	useEffect(() => {
		// 如果用户已登录，重定向到应用管理页面
		if (status === 'authenticated' && session) {
			router.replace('/app-management')
		}
	}, [session, status, router])

	// 如果正在加载认证状态，显示加载中
	if (status === 'loading') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg">加载中...</div>
			</div>
		)
	}

	// 如果未登录，显示欢迎页面
	if (status === 'unauthenticated') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">欢迎使用 Dify Chat Platform</h1>
					<p className="text-gray-600 mb-6">请先登录以访问应用管理功能</p>
					<button
						onClick={() => router.push('/login')}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						前往登录
					</button>
				</div>
			</div>
		)
	}

	// 已登录的情况下，显示重定向中的提示（实际上会很快跳转）
	return (
		<div className="flex items-center justify-center w-full min-h-full">
			<Spin spinning />
		</div>
	)
}
