'use client'

import { LocalStorageKeys, LocalStorageStore } from '@dify-chat/helpers'
import FingerPrintJS from '@fingerprintjs/fingerprintjs'
import { useMount } from 'ahooks'
import { message, Spin } from 'antd'
import { redirect } from 'next/navigation'

import { getRunningModeAction, loginAction } from '@/app/actions'
import { Logo } from '@/components'

export default function LoginPage() {
	/**
	 * 重定向到首页
	 */
	const redirect2Index = async () => {
		const runningMode = await getRunningModeAction()
		if (!runningMode) {
			message.error('获取运行模式失败，请检查配置')
			return
		}
		if (runningMode === 'singleApp') {
			redirect('/')
		} else if (runningMode === 'multiApp') {
			redirect('/apps')
		}
	}

	/**
	 * 调用登录 server action
	 */
	const mockLogin = async (): Promise<{
		userId: string
		enableSetting: boolean
	}> => {
		const fp = await FingerPrintJS.load()
		const result = await fp.get()
		const userInfo = await loginAction(result.visitorId)
		return userInfo
	}

	/**
	 * 登录
	 */
	const handleLogin = async () => {
		const userInfo = await mockLogin()
		LocalStorageStore.set(LocalStorageKeys.USER_ID, userInfo.userId)
		LocalStorageStore.set(LocalStorageKeys.ENABLE_SETTING, userInfo.enableSetting ? 'true' : '')
		message.success('登录成功')
		redirect2Index()
	}

	useMount(() => {
		handleLogin()
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
