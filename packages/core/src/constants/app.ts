/**
 * 应用类型
 */
export enum AppModeEnums {
	/**
	 * 文本生成
	 */
	TEXT_GENERATOR = 'completion',
	/**
	 * 聊天助手
	 */
	CHATBOT = 'chat',
	/**
	 * 工作流
	 */
	WORKFLOW = 'workflow',
	/**
	 * 支持工作流编排的聊天助手
	 */
	CHATFLOW = 'advanced-chat',
	/**
	 * 具备推理和自主调用能力的聊天助手
	 */
	AGENT = 'agent-chat',
}

/**
 * 应用类型的展示文本
 */
export const AppModeLabels = {
	[AppModeEnums.TEXT_GENERATOR]: 'Text Generator',
	[AppModeEnums.CHATBOT]: 'Chatbot',
	[AppModeEnums.WORKFLOW]: 'Workflow',
	[AppModeEnums.CHATFLOW]: 'Chatflow',
	[AppModeEnums.AGENT]: 'Agent',
}

/**
 * 应用类型选项
 */
export const AppModeOptions = [
	{
		label: '聊天助手',
		value: AppModeEnums.CHATBOT,
	},
	{
		label: '工作流',
		value: AppModeEnums.WORKFLOW,
	},
	{
		label: '支持工作流编排的聊天助手',
		value: AppModeEnums.CHATFLOW,
	},
	{
		label: '具备推理和自主调用能力的聊天助手',
		value: AppModeEnums.AGENT,
	},
	{
		label: '文本生成',
		value: AppModeEnums.TEXT_GENERATOR,
	},
]

/**
 * 开场白展示模式
 */
export const OpeningStatementDisplayMode = {
	Default: 'default',
	Always: 'always',
}

/**
 * 开场白展示模式选项
 */
export const OpeningStatementDisplayModeOptions = [
	{
		label: '默认（开始对话前展示）',
		value: OpeningStatementDisplayMode.Default,
	},
	{
		label: '总是展示',
		value: OpeningStatementDisplayMode.Always,
	},
]
