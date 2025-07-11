import { AppstoreOutlined, SettingOutlined } from '@ant-design/icons'
import { message, Segmented } from 'antd'
import { useHistory } from 'pure-react-router'
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
		route: '/admin/app-management',
	},
	{
		label: '系统配置',
		icon: <SettingOutlined />,
		value: ETopMenuKeys.SystemConfig,
		route: '/admin/system-config',
	},
]

export default function AdminHeaderTitle() {
	const history = useHistory()
	const [activeKey, setActiveKey] = useState<ETopMenuKeys>(ETopMenuKeys.AppManagement)

	useEffect(() => {
		const currentPath = history.location.pathname
		const key = TopMenuOptions.find(item => item.route === currentPath)?.value
		if (key) {
			setActiveKey(key)
		}
	}, [history.location.pathname])

	return (
		<Segmented
			value={activeKey}
			size="large"
			shape="round"
			options={TopMenuOptions}
			onChange={key => {
				const route = TopMenuOptions.find(item => item.value === key)?.route
				if (route) {
					history.push(route)
				} else {
					message.error('路径不存在')
				}
			}}
		/>
	)
}
