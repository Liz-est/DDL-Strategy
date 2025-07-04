'use client'

import { Button } from 'antd'

import { AppDetailDrawerModeEnum } from '@/app/apps/enums'
import { useAppEditDrawer } from '@/app/apps/hooks/use-app-edit-drawer'

interface IAddButtonProps {
	// children: React.ReactNode;
	refreshApps: () => void
}

export default function AddButton(props: IAddButtonProps) {
	const { refreshApps } = props
	const { setAppEditDrawerMode, setAppEditDrawerOpen, setAppEditDrawerAppItem, drawerComponent } =
		useAppEditDrawer({
			successCallback: () => {
				refreshApps()
			},
		})

	return (
		<>
			<Button
				type="primary"
				size="large"
				className="!absolute w-4/5 md:!w-96 box-border bottom-4 left-1/2 !rounded-3xl"
				style={{
					transform: 'translateX(-50%)',
				}}
				onClick={() => {
					setAppEditDrawerMode(AppDetailDrawerModeEnum.create)
					setAppEditDrawerOpen(true)
					setAppEditDrawerAppItem(undefined)
				}}
			>
				新增应用配置
			</Button>

			{drawerComponent}
		</>
	)
}
