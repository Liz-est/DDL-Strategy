import { GithubOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import LogoImage from '@/assets/images/logo.png'

export const LogoIcon = () => {
	return (
		<img
			className="w-5 h-5 inline-block"
			src={LogoImage}
			draggable={false}
			alt="logo"
		/>
	)
}

export const GithubIcon = () => {
	return (
		<Button
			type="link"
			href="https://github.com/lexmin0412/dify-chat"
			target="_blank"
			className="px-0"
		>
			<GithubOutlined className="text-xl cursor-pointer text-default" />
		</Button>
	)
}

interface ILogoProps {
	/**
	 * 是否隐藏 Github 图标
	 */
	hideGithubIcon?: boolean
}

export const Logo = (props: ILogoProps) => {
	const { hideGithubIcon } = props

	return (
		<div className="flex h-16 items-center justify-start py-0 box-border">
			<div className="h-full flex items-center flex-1 overflow-hidden">
				<img
					className="w-6 h-6 inline-block"
					src={LogoImage}
					draggable={false}
					alt="logo"
				/>
				<span className="inline-block my-0 mx-2 font-bold text-lg">Dify Chat</span>
			</div>
			{!hideGithubIcon && (
				<Button
					type="link"
					href="https://github.com/lexmin0412/dify-chat"
					target="_blank"
					className="px-0"
				>
					<GithubOutlined className="text-lg cursor-pointer text-default" />
				</Button>
			)}
		</div>
	)
}
