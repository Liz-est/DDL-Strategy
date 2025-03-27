import { GithubOutlined } from '@ant-design/icons'
import { Button } from 'antd'

export const LogoIcon = () => {
	return (
		<img
			className="w-5 h-5 inline-block"
			src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
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

export const Logo = () => {
	return (
		<div className="flex h-16 items-center justify-start py-0 px-6 box-border">
			<div className="h-full flex items-center flex-1 overflow-hidden">
				<img
					className="w-6 h-6 inline-block"
					src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
					draggable={false}
					alt="logo"
				/>
				<span className="inline-block my-0 mx-2 font-bold text-lg">Dify Chat</span>
			</div>
			<div>
				{/* <Button
          type="link"
          onClick={openSettingModal}
        >
          <SettingOutlined className="text-lg cursor-pointer text-default" />
        </Button> */}
				<Button
					type="link"
					href="https://github.com/lexmin0412/dify-chat"
					target="_blank"
					className="px-0"
				>
					<GithubOutlined className="text-lg cursor-pointer text-default" />
				</Button>
			</div>
		</div>
	)
}
