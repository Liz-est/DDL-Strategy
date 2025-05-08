import React, { useEffect } from 'react';

export type IThemeType = 'light' | 'dark' | 'system';

interface IThemeContext {
	theme?: IThemeType;
	setTheme?: (theme: IThemeType) => void;
}

export const ThemeContext = React.createContext<IThemeContext>({});

export const ThemeContextProvider = (props: { children: React.ReactNode }) => {
	const { children } = props;
	const [theme, setTheme] = React.useState<IThemeType>('system');

	/**
	 * 监听主题变化
	 */
	function handleColorSchemeChange(event: MediaQueryList) {
		if (event.matches) {
			setTheme('dark');
			document.body.classList.add('dark');
		} else {
			setTheme('light');
			document.body.classList.remove('dark');
		}
	}

	/**
	 * 初始化主题监听
	 */
	const initThemeListener = () => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		handleColorSchemeChange(mediaQuery);
		// @ts-expect-error 监听媒体查询的变化, FIXME: 类型错误, 待优化
		mediaQuery.addEventListener('change', handleColorSchemeChange);
	};

	useEffect(() => {
		initThemeListener();
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useThemeContext = () => {
	const { theme, setTheme } = React.useContext(ThemeContext);
	return { theme, setTheme };
};
