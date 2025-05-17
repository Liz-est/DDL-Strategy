import { Tag } from 'antd'

import AppIcon from './app-icon'

interface IAppInfoProps {
	info: {
		name: string
		description: string
		tags?: string[]
	}
}

/**
 * 应用信息
 */
export function AppInfo(props: IAppInfoProps) {
	const { info } = props
	return (
		<div className="text-theme-text pt-3">
			<div className="flex items-center px-4 mt-3">
				<AppIcon />
				<div className="ml-3 text-theme-text text-sm truncate">{info.name}</div>
			</div>
			{info.tags ? (
				<div className="mt-3 px-4">
					{info.tags.map(tag => {
						return (
							<Tag
								key={tag}
								className="!mb-2"
							>
								{tag}
							</Tag>
						)
					})}
				</div>
			) : null}
		</div>
	)
}
