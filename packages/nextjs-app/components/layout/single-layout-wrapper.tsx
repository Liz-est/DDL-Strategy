'use client'

import { getAppConfig, setAppConfig } from '@/app/actions/app-single'
import SingleAppLayout from '@/app/app/[appId]/layout/single-app-layout'

import PageLayoutWrapper from './page-layout-wrapper'

export default function SingleAppLayoutWrapper() {
	return (
		<PageLayoutWrapper>
			<SingleAppLayout
				getAppConfig={getAppConfig}
				setAppConfig={setAppConfig}
			/>
		</PageLayoutWrapper>
	)
}
