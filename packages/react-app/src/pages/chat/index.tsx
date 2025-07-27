import { difyChatRuntimeConfig } from '@/config/global'
import MultiAppLayout from '@/layout/multi-app-layout'
import SingleAppLayout from '@/layout/single-app-layout'

export default function ChatPage() {
	const mode = difyChatRuntimeConfig.get().runningMode

	if (mode === 'singleApp') {
		return <SingleAppLayout />
	}

	return <MultiAppLayout />
}
