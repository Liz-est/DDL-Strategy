"use client";
import { HeaderLayout } from "@/components";
import { IHeaderLayoutProps } from "@/components/layout/header";
import { ILucideIconProps, LucideIcon } from "@dify-chat/components";

export interface IHeaderProps {
	centerTitle: {
		title: string;
		icon: ILucideIconProps["name"];
	};
	rightLink: IHeaderLayoutProps["rightLink"];
}

export default function Header(props: IHeaderProps) {
	const { centerTitle, rightLink } = props;
	return (
		<HeaderLayout
			title={
				<div className="flex items-center">
					<LucideIcon name={centerTitle.icon} size={16} className="mr-1" />
					{centerTitle.title}
				</div>
			}
			rightLink={rightLink}
		/>
	);
}
