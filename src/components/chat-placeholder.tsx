import { IGetAppInfoResponse, IGetAppParametersResponse } from '@dify-chat/api'
import { Empty, FormInstance, FormItemProps } from 'antd'


import { AppInputForm } from '@dify-chat/components'

export interface IConversationEntryFormItem extends FormItemProps {
	type: 'input' | 'select'
}

interface IChatPlaceholderProps {
	/**
	 * 表单是否填写
	 */
	formFilled: boolean
	/**
	 * 表单填写状态改变回调
	 */
	onStartConversation: (formValues: Record<string, unknown>) => void
	/**
	 * 表单数据
	 */
	user_input_form?: IGetAppParametersResponse['user_input_form']
	/**
	 * 应用基本信息
	 */
	appInfo?: IGetAppInfoResponse
	/**
	 * 当前对话 ID
	 */
	conversationId: string
	/**
	 * 应用输入参数表单实例
	 */
	entryForm: FormInstance<any>
}

/**
 * 对话区域的占位组件（展示参数填写表单 / 应用信息）
 */
export const ChatPlaceholder = (props: IChatPlaceholderProps) => {
	const { formFilled, appInfo } = props

	return (
		<div className="w-full h-full flex items-center justify-center -mt-5">
			<div className="max-w-[80vw] w-3/5 py-6 px-10 rounded-3xl bg-gray-100 box-border">
				{appInfo ? (
					<AppInputForm 
						formFilled={formFilled}
						onStartConversation={props.onStartConversation}
						user_input_form={props.user_input_form}
						conversationId={props.conversationId}
						entryForm={props.entryForm}
					/>
				) : (
					<Empty description="请先配置 Dify 应用" />
				)}
			</div>
		</div>
	)
}
