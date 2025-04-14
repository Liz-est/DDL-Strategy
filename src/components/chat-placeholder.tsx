import { MessageOutlined } from '@ant-design/icons'
import { IGetAppInfoResponse, IGetAppParametersResponse } from '@dify-chat/api'
import { useDifyChat } from '@dify-chat/core'
import { Button, Empty, Form, FormItemProps, Input, Select } from 'antd'
import { useHistory, useParams, useSearchParams } from 'pure-react-router'
import { useEffect, useRef, useState } from 'react'

import { unParseGzipString } from '@/utils'

import AppInfo from './app-info'

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
	conversationId?: string
}

/**
 * 对话区域的占位组件（展示参数填写表单 / 应用信息）
 */
export const ChatPlaceholder = (props: IChatPlaceholderProps) => {
	const { formFilled, onStartConversation, user_input_form, appInfo, conversationId } = props
	const history = useHistory()
	const { appId } = useParams<{ appId: string }>()
	const searchParams = useSearchParams()
	const [userInputItems, setUserInputItems] = useState<IConversationEntryFormItem[]>([])
	const cachedSearchParams = useRef<URLSearchParams>(new URLSearchParams(searchParams))
	const { mode } = useDifyChat()

	const [entryForm] = Form.useForm()

	useEffect(() => {
		entryForm.resetFields()
	}, [conversationId])

	useEffect(() => {
		// 如果已经填写了，那就不需要了
		if (formFilled || !user_input_form?.length) {
			setUserInputItems([])
		}
		setUserInputItems(
			user_input_form?.map(item => {
				if (item['text-input']) {
					const originalProps = item['text-input']
					const baseProps: IConversationEntryFormItem = {
						type: 'input',
						label: originalProps.label,
						name: originalProps.variable,
					}
					const searchValue = cachedSearchParams.current.get(originalProps.variable)
					if (searchValue) {
						console.log(
							'unParseGzipString(searchValue)',
							cachedSearchParams.current.get(originalProps.variable),
							unParseGzipString(searchValue),
						)
						entryForm.setFieldValue(originalProps.variable, unParseGzipString(searchValue))
						cachedSearchParams.current.delete(originalProps.variable)
					}
					if (originalProps.required) {
						baseProps.required = true
						baseProps.rules = [{ required: true, message: '请输入' }]
					}
					return baseProps
				}
				return {} as IConversationEntryFormItem
			}) || [],
		)
		// 如果处理后的参数数量和之前的不一致，表示有表单相关，更新 URL
		if (searchParams.size !== cachedSearchParams.current.size) {
			if (cachedSearchParams.current.has('isNewCvst')) {
				cachedSearchParams.current.delete('isNewCvst')
			}
			const searchString = cachedSearchParams.current.size
				? `?${cachedSearchParams.current.toString()}`
				: ''
			if (mode === 'multiApp') {
				history.push(`/app/${appId}${searchString}`)
			} else {
				history.push(`/chat${searchString}`)
			}
		}
	}, [user_input_form])

	return (
		<div className="w-full h-full flex items-center justify-center -mt-5">
			<div className="max-w-[80vw] w-3/5 py-6 px-10 rounded-3xl bg-gray-100 box-border">
				{appInfo ? (
					<>
						<AppInfo info={appInfo} />
						{!formFilled && user_input_form?.length ? (
							<Form
								form={entryForm}
								className="mt-6"
								labelCol={{ span: 5 }}
							>
								{userInputItems.map(item => {
									return (
										<Form.Item
											key={item.name}
											name={item.name}
											label={item.label}
											required={item.required}
											rules={item.rules}
										>
											{item.type === 'input' ? (
												<Input placeholder="请输入" />
											) : item.type === 'select' ? (
												<Select placeholder="请选择" />
											) : (
												'不支持的控件类型'
											)}
										</Form.Item>
									)
								})}
							</Form>
						) : null}
						<div className="mt-3 w-full flex justify-center">
							<Button
								type="primary"
								icon={<MessageOutlined />}
								onClick={async () => {
									await entryForm.validateFields()
									onStartConversation(entryForm.getFieldsValue())
								}}
							>
								开始对话
							</Button>
						</div>
					</>
				) : (
					<Empty description="请先配置 Dify 应用" />
				)}
			</div>
		</div>
	)
}
