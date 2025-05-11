/**
 * 主题枚举
 */
export enum ThemeEnum {
	LIGHT = 'light',
	DARK = 'dark',
}

/**
 * 主题类型枚举
 */
export enum ThemeTypeEnum {
	SYSTEM = 'system',
	LIGHT = 'light',
	DARK = 'dark',
}

/**
 * 主题类型文本枚举
 */
export enum ThemeTypeLabelEnum {
	SYSTEM = '跟随系统',
	LIGHT = '浅色',
	DARK = '深色',
}

/**
 * 主题类型常量对应的选项
 */
export const ThemeTypeOptions = [
	{
		label: ThemeTypeLabelEnum.SYSTEM,
		value: ThemeTypeEnum.SYSTEM,
	},
	{
		label: ThemeTypeLabelEnum.LIGHT,
		value: ThemeTypeEnum.LIGHT,
	},
	{
		label: ThemeTypeLabelEnum.DARK,
		value: ThemeTypeEnum.DARK,
	},
];
