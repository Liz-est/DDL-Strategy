import { Form, FormInstance, Input, Select } from 'antd'

interface ISettingFormProps {
	formInstance: FormInstance<Record<string, unknown>>
}

export default function SettingForm(props: ISettingFormProps) {
	const { formInstance } = props

	const answerFormEnabled = Form.useWatch('answerForm.enabled', formInstance)

	return (
		<Form
			form={formInstance}
			labelAlign="left"
			className="mt-4"
			labelCol={{
				span: 6,
			}}
			initialValues={{
				'answerForm.enabled': false,
			}}
		>
			<div className="text-base mb-3 flex items-center">
				<div className="h-4 w-1 bg-primary rounded"></div>
				<div className="ml-2">基础配置</div>
			</div>
			<Form.Item
				label="API Base"
				name="apiBase"
				rules={[{ required: true }]}
				tooltip="Dify API 的域名+版本号前缀，如 https://api.dify.ai/v1"
				required
			>
				<Input placeholder="请输入 API BASE" />
			</Form.Item>
			<Form.Item
				label="API Secret"
				name="apiKey"
				tooltip="Dify App 的 API Secret (以 app- 开头)"
				rules={[{ required: true }]}
				required
			>
				<Input placeholder="请输入 API Key" />
			</Form.Item>
			<div className="text-base mb-3 flex items-center">
				<div className="h-4 w-1 bg-primary rounded"></div>
				<div className="ml-2">更多配置</div>
			</div>
			<Form.Item
				label="表单回复"
				name="answerForm.enabled"
				tooltip="当工作流需要回复表单给用户填写时，建议开启此功能"
				rules={[{ required: true }]}
				required
			>
				<Select
					placeholder="请选择"
					options={[
						{
							label: '启用',
							value: true,
						},
						{
							label: '禁用',
							value: false,
						},
					]}
				/>
			</Form.Item>
			{answerFormEnabled ? (
				<Form.Item
					label="提交消息文本"
					name="answerForm.feedbackText"
					tooltip="当启用表单回复时，用户填写表单并提交后，默认会以用户角色将填写的表单数据作为消息文本发送，如果配置了此字段，将会固定展示配置的字段值"
				>
					<Input placeholder="请输入提交消息文本" />
				</Form.Item>
			) : null}
		</Form>
	)
}
