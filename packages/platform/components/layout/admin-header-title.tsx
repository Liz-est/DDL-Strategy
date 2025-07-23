'use client'

import { AppstoreOutlined, SettingOutlined } from '@ant-design/icons'
import { message, Segmented } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

enum ETopMenuKeys {
	AppManagement = 'app-management',
	SystemConfig = 'system-config',
}

interface ITopMenuOption {
	label: string
	value: ETopMenuKeys
	route: string
	icon?: React.ReactNode
}

const TopMenuOptions: ITopMenuOption[] = [
	{
		label: '应用管理',
		icon: <AppstoreOutlined />,
		value: ETopMenuKeys.AppManagement,
		route: '/app-management',
	},
	{
		label: '系统配置',
		icon: <SettingOutlined />,
		value: ETopMenuKeys.SystemConfig,
		route: '/system-config',
	},
]

export default function AdminHeaderTitle() {
	const [activeKey, setActiveKey] = useState<ETopMenuKeys>()
	const navigate = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		const key = TopMenuOptions.find(item => item.route === pathname)?.value
		if (key) {
			setActiveKey(key)
		}
	}, [pathname])

	return (
		<Segmented
			value={activeKey}
			size="large"
			shape="round"
			options={TopMenuOptions}
			onChange={key => {
				const route = TopMenuOptions.find(item => item.value === key)?.route
				if (route) {
					navigate.push(route)
				} else {
					message.error('路径不存在')
				}
			}}
		/>
	)
}
