import { difyChatRuntimeConfig } from '@/config/global'
import MultiAppLayout from '@/layout/multi-app-layout'
import SingleAppLayout from '@/layout/single-app-layout'
import { appService } from '@/services/app/multiApp'
import { appConfig } from '@/services/app/singleApp'

export default function ChatPage() {
	const mode = difyChatRuntimeConfig.get().runningMode

	if (mode === 'singleApp') {
		return <SingleAppLayout getAppConfig={appConfig.getConfig} />
	}

	return <MultiAppLayout listApi={appService.getApps} />
}
