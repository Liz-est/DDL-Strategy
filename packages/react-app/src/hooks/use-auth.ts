import { LocalStorageKeys, LocalStorageStore } from '@dify-chat/helpers'
import { useHistory } from 'pure-react-router'

/**
 * 授权 hook
 */
export const useAuth = () => {
	const history = useHistory()
	const userId = LocalStorageStore.get(LocalStorageKeys.USER_ID)

	/**
	 * 跳转登录页
	 */
	const goAuthorize = () => {
		history.push('/auth')
	}

	return {
		isAuthorized: !!userId,
		goAuthorize,
		userId,
	}
}
