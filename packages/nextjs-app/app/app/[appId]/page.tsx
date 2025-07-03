'use client'

import { useRequest } from 'ahooks'
import { Spin } from 'antd'
import { redirect, useParams, useSearchParams } from 'next/navigation'

import { getRunningModeAction } from '@/app/actions'
import { getAppConfig, setAppConfig } from '@/app/actions/app-single'
import MultiAppLayout from '@/app/app/[appId]/layout/multi-app-layout'
import { RunningModes } from '@/constants'
import { IRunningMode } from '@/types'

import SingleAppLayout from './layout/single-app-layout'

export default function AppPage() {
	const { appId } = useParams<{ appId: string }>()
	const searchParams = useSearchParams()
	// 获取当前的 RunningMode
	const { data: runningMode, loading } = useRequest(
		() => {
			return getRunningModeAction()
		},
		{
			onSuccess: (runningMode: IRunningMode) => {
				// 如果是单应用模式，判断来源是否是控制台，否则重定向到首页再次分流
				if (
					runningMode === RunningModes.SingleApp &&
					searchParams.get('sourcePage') !== 'console'
				) {
					redirect('/')
				}
			},
		},
	)

	if (loading) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<Spin spinning />
			</div>
		)
	}

	if (runningMode === RunningModes.MultiApp) {
		return <MultiAppLayout appId={appId} />
	}

	if (runningMode === RunningModes.SingleApp) {
		return (
			<SingleAppLayout
				getAppConfig={getAppConfig}
				setAppConfig={setAppConfig}
			/>
		)
	}

	return (
		<div className="flex items-center justify-center w-full h-full">
			不支持的运行模式：{runningMode}
		</div>
	)
}
