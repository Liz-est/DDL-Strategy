import React, { useCallback, useEffect, useState } from 'react';
import { ThemeEnum, ThemeTypeEnum } from '../constants';

/**
 * 主题类型，用于用户手动切换， light-固定浅色 dark-固定深色，system-跟随系统
 */
export type IThemeType = 'light' | 'dark' | 'system';

/**
 * 实际应用的主题
 */
export type ICurrentTheme = 'light' | 'dark';

/**
 * 主题上下文类型定义
 */
interface IThemeContext {
	/**
	 * 当前主题
	 */
	theme: ThemeEnum;
	/**
	 * 手动设置主题类型类型
	 */
	setTheme: (theme: ThemeTypeEnum) => void;
	/**
	 * 当前主题类型
	 */
	themeType: ThemeTypeEnum;
}

/**
 * 主题上下文
 */
export const ThemeContext = React.createContext<IThemeContext>({
	theme: ThemeEnum.LIGHT,
	setTheme: () => {},
	themeType: ThemeTypeEnum.SYSTEM,
});

/**
 * 暗黑模式的 body 类名
 */
export const DARK_CLASS_NAME = 'dark';

/**
 * 主题上下文提供者
 */
export const ThemeContextProvider = (props: { children: React.ReactNode }) => {
	const { children } = props;
	const [themeType, setThemeType] = useState<ThemeTypeEnum>(
		ThemeTypeEnum.SYSTEM,
	);
	const [themeState, setThemeState] = React.useState<ThemeEnum>(
		ThemeEnum.LIGHT,
	);

	/**
	 * 监听主题变化
	 */
	const handleColorSchemeChange = useCallback(
		(event: MediaQueryList) => {
			if (event.matches) {
				setThemeState(ThemeEnum.DARK);
				document.body.classList.add(DARK_CLASS_NAME);
			} else {
				setThemeState(ThemeEnum.LIGHT);
				document.body.classList.remove(DARK_CLASS_NAME);
			}
		},
		[setThemeState],
	);

	/**
	 * 初始化主题监听
	 */
	const initThemeListener = () => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		handleColorSchemeChange(mediaQuery);
		// 只有跟随系统时才监听媒体查询
		if (themeType === ThemeTypeEnum.SYSTEM) {
			// @ts-expect-error 监听媒体查询的变化, FIXME: 类型错误, 待优化
			mediaQuery.addEventListener('change', handleColorSchemeChange);
		}
	};

	useEffect(() => {
		initThemeListener();
	}, []);

	const handleUserSelect = (themeType: ThemeTypeEnum) => {
		setThemeType(themeType);
		if (themeType === ThemeTypeEnum.SYSTEM) {
			initThemeListener();
		} else {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			// @ts-expect-error 移除监听媒体查询的变化, FIXME: 类型错误, 待优化
			mediaQuery.removeEventListener('change', handleColorSchemeChange);
			if (themeType === ThemeTypeEnum.DARK) {
				setThemeState(ThemeEnum.DARK);
				document.body.classList.add(DARK_CLASS_NAME);
			} else if (themeType === ThemeTypeEnum.LIGHT) {
				setThemeState(ThemeEnum.LIGHT);
				document.body.classList.remove(DARK_CLASS_NAME);
			}
		}
	};

	return (
		<ThemeContext.Provider
			value={{ theme: themeState, setTheme: handleUserSelect, themeType }}
		>
			{children}
		</ThemeContext.Provider>
	);
};

export const useThemeContext = () => {
	const context = React.useContext(ThemeContext);
	return {
		...context,
		isDark: context.theme === ThemeEnum.DARK,
		isLight: context.theme === ThemeEnum.LIGHT,
		isSystemMode: context.themeType === ThemeTypeEnum.SYSTEM,
	};
};
