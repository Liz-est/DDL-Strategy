import { CaretRightOutlined } from '@ant-design/icons'
import { IDifyAppItem } from '@dify-chat/core'
import { isTempId } from '@dify-chat/helpers'
import { Collapse, CollapseProps, theme } from 'antd'
import { CSSProperties, useEffect, useState } from 'react'

import AppInputForm, { IAppInputFormProps } from './app-input-form'

/**
 * 应用输入参数管理容器
 */
export default function AppInputWrapper(
	props: IAppInputFormProps & {
		appConfig?: IDifyAppItem
	},
) {
	const { token } = theme.useToken()
	const [activeKey, setActiveKey] = useState<string[]>([])
	const { conversationId, appConfig } = props

	useEffect(() => {
		if (isTempId(conversationId)) {
			setActiveKey(['1'])
		} else {
			setActiveKey([])
		}
	}, [conversationId])

	if (!props.user_input_form?.length) {
		return null
	}

	const getItems: (panelStyle: CSSProperties) => CollapseProps['items'] = panelStyle => [
		{
			key: '1',
			label: (
				<div className="flex items-center">
					<div className="font-semibold text-base">对话参数设置</div>
					{!appConfig?.inputParams?.enableUpdateAfterCvstStarts ? (
						<div className="text-desc">（注意：对话开始后，参数设置将无法修改）</div>
					) : null}
				</div>
			),
			children: (
				<AppInputForm
					formFilled={props.formFilled}
					onStartConversation={props.onStartConversation}
					user_input_form={props.user_input_form}
					conversationId={props.conversationId}
					entryForm={props.entryForm}
					appConfig={appConfig}
				/>
			),
			style: panelStyle,
		},
	]

	const panelStyle: React.CSSProperties = {
		color: token.colorText,
		borderRadius: '8px',
		border: `1px solid #eff0f5`,
	}

	return (
		<Collapse
			className="mt-3 bg-primary"
			bordered={false}
			activeKey={activeKey}
			onChange={value => setActiveKey(value)}
			expandIconPosition="end"
			expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
			style={{ background: token.colorBgContainer, borderColor: token.colorPrimary }}
			items={getItems(panelStyle)}
		/>
	)
}
