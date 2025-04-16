import {
	IGetAppParametersResponse,
	IUserInputFormItemType,
	IUserInputFormItemValueBase,
} from '@dify-chat/api'
import { useDifyChat } from '@dify-chat/core'
import { unParseGzipString } from '@dify-chat/helpers'
import { Form, FormInstance, FormItemProps, Input, InputNumber, Select } from 'antd'
import { useHistory, useParams, useSearchParams } from 'pure-react-router'
import { useEffect, useRef, useState } from 'react'

import useConversationsContext from '../../../core/src/hooks/use-conversations'

export type IConversationEntryFormItem = FormItemProps &
	Pick<IUserInputFormItemValueBase, 'options' | 'max_length'> & {
		type: IUserInputFormItemType
	}

const SUPPORTED_CONTROL_TYPES = ['text-input', 'select', 'number', 'paragraph']

export interface IAppInputFormProps {
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
	 * 当前对话 ID
	 */
	conversationId: string
	/**
	 * 应用入参的表单实例
	 */
	// FIXME: any 类型后续优化 @ts-expect-error
	entryForm: FormInstance<Record<string, unknown>>
}

/**
 * 应用输入表单
 */
export default function AppInputForm(props: IAppInputFormProps) {
	const { user_input_form, conversationId, entryForm } = props
	const { currentConversationId, setConversations } = useConversationsContext()
	const history = useHistory()
	const { appId } = useParams<{ appId: string }>()
	const searchParams = useSearchParams()
	const [userInputItems, setUserInputItems] = useState<IConversationEntryFormItem[]>([])
	const cachedSearchParams = useRef<URLSearchParams>(new URLSearchParams(searchParams))
	const { mode } = useDifyChat()
	useEffect(() => {
		entryForm.resetFields()
	}, [conversationId])

	useEffect(() => {
		// 如果已经填写了，那就不需要了
		if (!user_input_form?.length) {
			setUserInputItems([])
			return
		}
		setUserInputItems(
			user_input_form?.map(item => {
				const fieldType = Object.keys(item)[0]
				const fieldInfo = Object.values(item)[0]
				const originalProps = fieldInfo
				const baseProps: IConversationEntryFormItem = {
					type: fieldType as IUserInputFormItemType,
					label: originalProps.label,
					name: originalProps.variable,
					options: originalProps.options,
					max_length: originalProps.max_length,
				}
				const searchValue = cachedSearchParams.current.get(originalProps.variable)
				if (searchValue) {
					entryForm.setFieldValue(originalProps.variable, unParseGzipString(searchValue))
					cachedSearchParams.current.delete(originalProps.variable)
				}
				if (originalProps.required) {
					baseProps.required = true
					baseProps.rules = [{ required: true, message: '请输入' }]
				}
				return baseProps
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

	console.log('user_input_form', user_input_form)

	return (
		<>
			{user_input_form?.length ? (
				<Form
					form={entryForm}
					className="mt-6"
					labelCol={{ span: 5 }}
					onValuesChange={(_, allValues) => {
						setConversations(prev => {
							console.log(
								'setConversations: onValuesChange',
								prev.map(item => {
									if (item.id === currentConversationId) {
										return {
											...item,
											inputs: allValues,
										}
									}
									return item
								}),
							)
							return prev.map(item => {
								if (item.id === currentConversationId) {
									return {
										...item,
										inputs: allValues,
									}
								}
								return item
							})
						})
					}}
				>
					{userInputItems
						.filter(item => SUPPORTED_CONTROL_TYPES.includes(item.type))
						.map(item => {
							return (
								<Form.Item
									key={item.name}
									name={item.name}
									label={item.label}
									required={item.required}
									rules={item.rules}
								>
									{item.type === 'text-input' ? (
										<Input
											placeholder="请输入"
											maxLength={item.max_length}
										/>
									) : item.type === 'select' ? (
										<Select
											placeholder="请选择"
											options={
												item.options?.map(option => {
													return {
														value: option,
														label: option,
													}
												}) || []
											}
										/>
									) : item.type === 'paragraph' ? (
										<Input.TextArea
											placeholder="请输入"
											maxLength={item.max_length}
										/>
									) : item.type === 'number' ? (
										<InputNumber
											placeholder="请输入"
											className="w-full"
										/>
									) : (
										`暂不支持的控件类型: ${item.type}`
									)}
								</Form.Item>
							)
						})}
				</Form>
			) : null}
		</>
	)
}
