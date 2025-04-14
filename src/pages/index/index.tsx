import { useDifyChat } from '@dify-chat/core'
import { useHistory } from 'pure-react-router'

export default function IndexPage() {
	const { mode } = useDifyChat()
	const history = useHistory()

	if (mode === 'singleApp') {
		history.push('/chat')
	} else if (mode === 'multiApp') {
		history.push('/apps')
	}

	return null
}
