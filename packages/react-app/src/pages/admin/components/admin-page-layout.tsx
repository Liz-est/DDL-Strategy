import { ReactNode } from 'react'

import PageLayout from '@/components/layouts/page-layout'

import AdminHeaderTitle from './admin-header-title'

interface IAdminPageLayoutProps {
	children: ReactNode
}

/**
 * 控制台的页面布局组件
 */
export default function AdminPageLayout(props: IAdminPageLayoutProps) {
	const { children } = props

	return (
		<PageLayout
			headerProps={{
				logoText: 'Dify Chat Admin',
				isTitleWrapped: true,
				title: <AdminHeaderTitle />,
			}}
		>
			{children}
		</PageLayout>
	)
}
