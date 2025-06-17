import { IDifyChatMode } from '@dify-chat/core'
import { useHistory } from 'pure-react-router'

/**
 * 重定向到首页
 * @param runningMode 运行模式
 */
export const useRedirect2Index = (runningMode: IDifyChatMode) => {
	const history = useHistory()

	return () => {
		if (runningMode === 'singleApp') {
			history.push('/chat')
		} else {
			history.push('/apps')
		}
	}
}
