"use client";
import { ILucideIconProps, LucideIcon } from "@dify-chat/components";
import { useIsMobile } from "@dify-chat/helpers";
import { ThemeSelector, useThemeContext } from "@dify-chat/theme";
import { Space } from "antd";
import classNames from "classnames";
import React from "react";

import { Logo } from "./logo";

import { CenterTitleWrapper } from "@dify-chat/components";
import Link from "next/link";

export interface IHeaderLayoutProps {
	title: React.ReactNode;
	rightIcon?: React.ReactNode;
	rightLink: {
		icon: ILucideIconProps["name"];
		href: string;
	};
}

const HeaderSiderIcon = (props: {
	align: "left" | "right";
	children: React.ReactNode;
}) => {
	return (
		<div
			className={classNames({
				"flex-1 h-full flex items-center": true,
				"justify-start": props.align === "left",
				"justify-end": props.align === "right",
			})}
		>
			{props.children}
		</div>
	);
};

/**
 * 头部布局组件
 */
export default function HeaderLayout(props: IHeaderLayoutProps) {
	const { title, rightIcon, rightLink } = props;
	const { themeMode } = useThemeContext();
	const isMobile = useIsMobile();
	return (
		<div className="h-16 flex items-center justify-between px-4">
			{/* 🌟 Logo */}
			<HeaderSiderIcon align="left">
				<Logo hideText={isMobile} hideGithubIcon />
			</HeaderSiderIcon>

			<CenterTitleWrapper>{title}</CenterTitleWrapper>

			{/* 右侧图标 */}
			<HeaderSiderIcon align="right">
				{rightIcon || (
					<Space size="middle" className="flex items-center">
						<Link href={rightLink.href} title="控制台">
							<LucideIcon
								className="cursor-pointer"
								name={rightLink.icon}
								size={20}
								color="var(--theme-text-color)"
							/>
						</Link>
						<ThemeSelector>
							<div className="flex items-center cursor-pointer">
								<LucideIcon
									name={
										themeMode === "dark"
											? "moon-star"
											: themeMode === "light"
												? "sun"
												: "screen-share"
									}
									size={20}
								/>
							</div>
						</ThemeSelector>
						<Link
							href="https://github.com/lexmin0412/dify-chat"
							target="_blank"
							title="Github"
						>
							<LucideIcon
								name="github"
								size={20}
								color="var(--theme-text-color)"
							/>
						</Link>
					</Space>
				)}
			</HeaderSiderIcon>
		</div>
	);
}
