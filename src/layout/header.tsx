import { useIsMobile } from '@dify-chat/helpers'
import React from 'react'

import { GithubIcon, Logo } from '@/components/logo'

import CenterTitleWrapper from './components/center-title-wrapper'

interface IHeaderLayoutProps {
	title: React.ReactNode
	rightIcon?: React.ReactNode
}

/**
 * 头部布局组件
 */
export default function HeaderLayout(props: IHeaderLayoutProps) {
	const { title, rightIcon } = props
	const isMobile = useIsMobile()
	return (
		<div className="h-16 flex items-center justify-between px-4">
			{/* 🌟 Logo */}
			<Logo
				hideText={isMobile}
				hideGithubIcon
			/>

			<CenterTitleWrapper>{title}</CenterTitleWrapper>

			{/* 右侧图标 */}
			{rightIcon || <GithubIcon />}
		</div>
	)
}
