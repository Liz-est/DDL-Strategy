"use client";
import { ThemeContextProvider, useThemeContext } from "@dify-chat/theme";
import { ConfigProvider, theme } from "antd";
import React from "react";
import { initResponsiveConfig } from "@dify-chat/helpers";
import "@ant-design/v5-patch-for-react-19";

initResponsiveConfig();

const ThemeContextWrapper = ({ children }: { children: React.ReactNode }) => {
	const { isDark } = useThemeContext();

	return (
		<ConfigProvider
			theme={{
				algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
			}}
		>
			{children}
		</ConfigProvider>
	);
};

/**
 * 主要的作用是为 AntD 的 ConfigProvider 提供主题获取功能
 */
export default function PageLayoutWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeContextProvider>
			<ThemeContextWrapper>{children}</ThemeContextWrapper>
		</ThemeContextProvider>
	);
}
