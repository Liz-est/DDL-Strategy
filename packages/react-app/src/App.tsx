import { initResponsiveConfig } from '@dify-chat/helpers'
import { useThemeContext } from '@dify-chat/theme'
import { theme as antdTheme, ConfigProvider } from 'antd'
import { BrowserRouter, type IRoute } from 'pure-react-router'

import { difyChatRuntimeConfig } from '@/config/global'

import './App.css'
import LayoutIndex from './layout'
import AppManagementPage from './pages/admin/app-management'
import SystemConfigPage from './pages/admin/system-config'
import AppListPage from './pages/client/apps'
import AuthPage from './pages/client/auth'
import ChatPage from './pages/client/chat'

// 初始化响应式配置
initResponsiveConfig()

// 初始化全局运行时配置
difyChatRuntimeConfig.init('multiApp')

const routes: IRoute[] = [
	{ path: '/admin/app-management', component: () => <AppManagementPage /> },
	{ path: '/admin/system-config', component: () => <SystemConfigPage /> },
	{ path: '/client/auth', component: () => <AuthPage /> },
	{ path: '/client/chat', component: () => <ChatPage /> },
	{ path: '/client/app/:appId', component: () => <ChatPage /> },
	{ path: '/client/apps', component: () => <AppListPage /> },
]

/**
 * Dify Chat 的最小应用实例
 */
export default function App() {
	const { isDark } = useThemeContext()

	return (
		<ConfigProvider
			theme={{
				algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
			}}
		>
			<BrowserRouter
				basename="/dify-chat"
				routes={routes}
			>
				<LayoutIndex />
			</BrowserRouter>
		</ConfigProvider>
	)
}
