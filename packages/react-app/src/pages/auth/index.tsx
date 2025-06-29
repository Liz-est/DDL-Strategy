import { Logo } from '@dify-chat/components'
import { LocalStorageKeys, LocalStorageStore } from '@dify-chat/helpers'
import FingerPrintJS from '@fingerprintjs/fingerprintjs'
import { useMount } from 'ahooks'
import { Spin } from 'antd'

import { difyChatRuntimeConfig } from '@/config/global'
import { useAuth } from '@/hooks/use-auth'
import { useRedirect2Index } from '@/hooks/use-jump'

export default function AuthPage() {
	const { userId } = useAuth()
	const mode = difyChatRuntimeConfig.get().runningMode
	const redirect2Index = useRedirect2Index(mode)

	/**
	 * 模拟登录接口
	 */
	const mockLogin = async () => {
		const fp = await FingerPrintJS.load()
		const result = await fp.get()
		return {
			userId: result.visitorId,
			enableSetting: true,
		}
	}

	/**
	 * 登录函数
	 */
	const handleLogin = async () => {
		const userInfo = await mockLogin()
		LocalStorageStore.set(LocalStorageKeys.USER_ID, userInfo.userId)
		LocalStorageStore.set(LocalStorageKeys.ENABLE_SETTING, userInfo.enableSetting ? 'true' : '')
		redirect2Index()
	}

	useMount(() => {
		if (!userId) {
			// 模拟自动登录
			handleLogin()
		} else {
			redirect2Index()
		}
	})

	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center bg-theme-bg">
			<div className="absolute flex-col w-full h-full left-0 top-0 z-50 flex items-center justify-center">
				<Logo hideGithubIcon />
				<div className="text-theme-text">授权登录中...</div>
				<div className="mt-6">
					<Spin spinning />
				</div>
			</div>
		</div>
	)
}
