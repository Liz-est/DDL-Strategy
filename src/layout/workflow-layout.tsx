import { DifyApi } from '@dify-chat/api'
import { AppInfo, AppInputForm } from '@dify-chat/components'
import { IDifyAppItem, useAppContext } from '@dify-chat/core'
import { Button, Form } from 'antd'

interface IWorkflowLayoutProps {
	difyApi: DifyApi
}

/**
 * 工作流应用详情布局
 */
export default function WorkflowLayout(props: IWorkflowLayoutProps) {
	const { difyApi } = props
	const [entryForm] = Form.useForm()
	const { currentApp } = useAppContext()

	return (
		<div className="flex items-stretch w-full">
			<div className="flex-1 overflow-hidden border-r border-solid border-[#eff0f5]">
				<div className="font-semibold text-lg px-6 pt-6">运行工作流</div>
				<div className="px-2">
					<AppInfo info={currentApp?.config.info as NonNullable<IDifyAppItem['info']>} />
				</div>
				<div className="px-6 mt-6">
					<AppInputForm
						onStartConversation={values => {
							console.log('onStartConversation', values)
						}}
						formFilled={false}
						entryForm={entryForm}
						uploadFileApi={difyApi.uploadFile}
					/>
				</div>
				<div className="flex justify-end px-6">
					<Button
						type="primary"
						onClick={async () => {
							await entryForm.validateFields()
							const values = await entryForm.getFieldsValue()
							console.log('values', values)
						}}
					>
						运行
					</Button>
				</div>
			</div>
			<div className="flex-1 px-4 pt-6">运行结果</div>
		</div>
	)
}
