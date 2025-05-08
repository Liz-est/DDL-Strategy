import { FilterFilled, HomeFilled, RobotFilled } from '@ant-design/icons'

type IIconType = 'start' | 'question-classifier' | 'llm'

interface IWorkflowNodeIconProps {
	type: IIconType
}

const iconMap: Record<IIconType, React.ReactNode> = {
	start: <HomeFilled className="!text-theme-text" />,
	'question-classifier': <FilterFilled className="!text-theme-text" />,
	llm: <RobotFilled className="!text-theme-text" />,
}

/**
 * 工作流节点图标
 */
export default function WorkflowNodeIcon(props: IWorkflowNodeIconProps) {
	return iconMap[props.type] || <RobotFilled className="!text-theme-text" />
}
