'use client'

import '@ant-design/v5-patch-for-react-19'
import { initResponsiveConfig } from '@dify-chat/helpers'
import { ThemeContextProvider, useThemeContext } from '@dify-chat/theme'
import { ConfigProvider, theme } from 'antd'
import { usePathname } from 'next/navigation'
import React from 'react'

import AuthGuard from '../auth/auth-guard'
import AdminPageLayout from './admin-page-layout'

initResponsiveConfig()

const ThemeContextWrapper = ({ children }: { children: React.ReactNode }) => {
	const { isDark } = useThemeContext()

	return (
		<ConfigProvider
			theme={{
				algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
			}}
		>
			{children}
		</ConfigProvider>
	)
}

/**
 * 主要的作用是为 AntD 的 ConfigProvider 提供主题获取功能
 */
export default function PageLayoutWrapper({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const isLoginPage = pathname === '/login'

	return (
		<ThemeContextProvider>
			<ThemeContextWrapper>
				{isLoginPage ? (
					children
				) : (
					<AuthGuard>
						<AdminPageLayout>{children}</AdminPageLayout>
					</AuthGuard>
				)}
			</ThemeContextWrapper>
		</ThemeContextProvider>
	)
}
