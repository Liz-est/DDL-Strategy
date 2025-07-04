'use client'

import { useMount } from 'ahooks'
import { Empty, Row } from 'antd'
import { useMemo, useState } from 'react'

import { getAppList } from '@/app/apps/actions'
import AppItem from '@/app/apps/components/app-item'
import HeaderWrapper, { IHeaderProps } from '@/components/layout/header-wrapper'
import { IDifyAppItem } from '@/types'

import { getUserAction } from '../actions'
import AddButton from './components/add-button'

export default function AppsPage() {
	const [apps, setApps] = useState<IDifyAppItem[]>()
	const [user, setUser] = useState<{
		userId: string
		enableSetting: boolean
	}>({
		userId: '',
		enableSetting: false,
	})

	const refreshAppList = async () => {
		const appsRes = await getAppList({
			isMask: true,
		})
		setApps(appsRes)
	}

	const initData = async () => {
		const user = await getUserAction()
		setUser(user)
		refreshAppList()
	}

	useMount(() => {
		initData()
	})

	const headerWrapperProps: IHeaderProps = useMemo(() => {
		return {
			centerTitle: {
				icon: 'layout-grid',
				title: '应用列表',
			},
		}
	}, [])

	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			<HeaderWrapper {...headerWrapperProps} />
			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden">
				{apps?.length ? (
					<Row
						gutter={[16, 16]}
						className="px-3 md:px-6"
					>
						{apps.map(item => {
							return (
								<AppItem
									key={item.id}
									item={item}
									enableSetting={user.enableSetting}
									refreshAppList={refreshAppList}
								/>
							)
						})}
					</Row>
				) : (
					<div className="w-full h-full box-border flex flex-col items-center justify-center px-3">
						<Empty description="暂无应用" />
					</div>
				)}
			</div>

			{user.enableSetting ? <AddButton refreshApps={refreshAppList} /> : null}
		</div>
	)
}
