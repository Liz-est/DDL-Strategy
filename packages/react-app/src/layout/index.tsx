import { useDifyChat } from '@dify-chat/core'
import { Route, useHistory } from 'pure-react-router'
import { useEffect } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { useRedirect2Index } from '@/hooks/use-jump'

/**
 * 处理路由的布局容器
 */
export default function LayoutIndex() {
	const history = useHistory()
	const { mode } = useDifyChat()
	const { isAuthorized, goAuthorize } = useAuth()
	const redirect2Index = useRedirect2Index(mode)

	useEffect(() => {
		const pathname = history.location.pathname

		// 如果未登录，则跳转登录
		if (!isAuthorized && pathname !== '/auth') {
			goAuthorize()
			return
		}

		if (pathname === '' || pathname === '/') {
			redirect2Index()
		}
	}, [history, mode, isAuthorized])

	return <Route />
}
