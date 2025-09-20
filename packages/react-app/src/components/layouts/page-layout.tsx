import { HeaderLayout, IHeaderLayoutProps } from '@/components'

interface IPageLayoutProps {
	headerProps: IHeaderLayoutProps
	children: React.ReactNode
}

export default function PageLayout(props: IPageLayoutProps) {
	const { headerProps, children } = props
	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			{/* 头部 */}
			<HeaderLayout {...headerProps} />
			<div className="flex-1 bg-theme-main-bg rounded-t-3xl py-6 overflow-y-auto box-border overflow-x-hidden flex items-center">
				{children}
			</div>
		</div>
	)
}
