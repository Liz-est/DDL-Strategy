import { Dropdown } from 'antd';
import { useThemeContext } from '../hooks';
import { ThemeTypeEnum, ThemeTypeLabelEnum } from '../constants';
import { DynamicIcon } from 'lucide-react/dynamic';

interface IThemeSelectorProps {
	children?: React.ReactNode;
}

/**
 * 主题选择器组件
 */
export default function ThemeSelector(props: IThemeSelectorProps) {
	const { children } = props;
	const { themeType, setTheme } = useThemeContext();

	return (
		<Dropdown
			placement="bottomRight"
			menu={{
				selectedKeys: [themeType],
				items: [
					{
						type: 'item',
						key: ThemeTypeEnum.SYSTEM,
						label: ThemeTypeLabelEnum.SYSTEM,
						icon: <DynamicIcon name="screen-share" />,
					},
					{
						type: 'item',
						key: ThemeTypeEnum.LIGHT,
						label: ThemeTypeLabelEnum.LIGHT,
						icon: <DynamicIcon name="sun" />,
					},
					{
						type: 'item',
						key: ThemeTypeEnum.DARK,
						label: ThemeTypeLabelEnum.DARK,
						icon: <DynamicIcon name="moon-star" />,
					},
				],
				onClick: (item) => {
					setTheme(item.key as ThemeTypeEnum);
				},
			}}
		>
			{children}
		</Dropdown>
	);
}
