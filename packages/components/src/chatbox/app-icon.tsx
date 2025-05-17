import { Bot } from 'lucide-react'

/**
 * 应用图标
 */
export default function AppIcon(props: { size?: 'small' | 'default' }) {
	const { size = 'default' } = props
	return (
		<div
			className={`bg-[#ffead5] dark:bg-transparent border border-solid border-transparent dark:border-theme-border rounded-lg ${size === 'small' ? 'p-1' : 'p-2'} flex items-center`}
		>
			<Bot className="text-theme-text" />
		</div>
	)
}
