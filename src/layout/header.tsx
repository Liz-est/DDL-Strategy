import { useIsMobile } from '@dify-chat/helpers'
import classNames from 'classnames'
import React from 'react'

import { GithubIcon, Logo } from '@/components/logo'

import CenterTitleWrapper from './components/center-title-wrapper'

interface IHeaderLayoutProps {
	title: React.ReactNode
	rightIcon?: React.ReactNode
}

const HeaderSiderIcon = (props: { align: 'left' | 'right'; children: React.ReactNode }) => {
	return (
		<div
			className={classNames({
				'flex-1 h-full flex items-center': true,
				'justify-start': props.align === 'left',
				'justify-end': props.align === 'right',
			})}
		>
			{props.children}
		</div>
	)
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
			<HeaderSiderIcon align="left">
				<Logo
					hideText={isMobile}
					hideGithubIcon
				/>
			</HeaderSiderIcon>

			<CenterTitleWrapper>{title}</CenterTitleWrapper>

			{/* 右侧图标 */}
			<HeaderSiderIcon align="right">{rightIcon || <GithubIcon />}</HeaderSiderIcon>
		</div>
	)
}
