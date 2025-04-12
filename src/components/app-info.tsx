import { RobotOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

interface IAppInfoProps {
	info: {
		name: string
		description: string
		tags?: string[]
	}
}

export default function AppInfo(props: IAppInfoProps) {
	const { info } = props
	return (
		<div className="text-default">
			<div className="flex items-center justify-center flex-col">
				<RobotOutlined className="text-2xl text-primary" />
				<div className="text-2xl font-bold mt-3">{info.name}</div>
				<div className="text-desc text-base max-w-96 mt-3 text-center">{info.description}</div>
				{info.tags ? (
					<div className="mt-3 text-center">
						{info.tags.map(tag => {
							return (
								<Tag
									key={tag}
									className="mb-2"
								>
									{tag}
								</Tag>
							)
						})}
					</div>
				) : null}
			</div>
		</div>
	)
}
