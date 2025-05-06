import { DifyApi } from '@dify-chat/api'
import { IDifyAppItem, IDifyChatContextMultiApp, useDifyChat } from '@dify-chat/core'
import { useRequest } from 'ahooks'
import { Button, Drawer, DrawerProps, Form, Input, message, Space } from 'antd'
import { useEffect, useState } from 'react'

import { AppDetailDrawerModeEnum } from './app-manage-drawer'
import SettingForm from './setting-form'

interface IAppEditDrawerProps extends DrawerProps {
	detailDrawerMode: AppDetailDrawerModeEnum
	confirmLoading?: boolean
	appItem?: IDifyAppItem
	onClose?: () => void
	confirmCallback?: () => void
}

/**
 * 应用配置编辑抽屉
 */
export const AppEditDrawer = (props: IAppEditDrawerProps) => {
	const { detailDrawerMode, appItem, open, onClose, confirmCallback } = props
	const { user, appService } = useDifyChat() as IDifyChatContextMultiApp
	const [settingForm] = Form.useForm()
	const [confirmLoading, setConfirmBtnLoading] = useState(false)
	useEffect(() => {
		if (!open) {
			settingForm.resetFields()
		} else if (detailDrawerMode === AppDetailDrawerModeEnum.edit) {
			settingForm.setFieldsValue({
				apiBase: appItem?.requestConfig.apiBase,
				apiKey: appItem?.requestConfig.apiKey,
				'answerForm.enabled': appItem?.answerForm?.enabled || false,
				'answerForm.feedbackText': appItem?.answerForm?.feedbackText || '',
				'inputParams.enableUpdateAfterCvstStarts':
					appItem?.inputParams?.enableUpdateAfterCvstStarts || false,
			})
		}
	}, [open])

	const { runAsync: createApp } = useRequest(
		async (appInfo: IDifyAppItem) => {
			return appService.addApp(appInfo)
		},
		{
			manual: true,
			onSuccess: () => {
				onClose?.()
				message.success('新增应用配置成功')
			},
		},
	)

	const { runAsync: updateApp } = useRequest(
		async (appInfo: IDifyAppItem) => {
			return appService.updateApp(appInfo)
		},
		{
			manual: true,
			onSuccess: () => {
				onClose?.()
				message.success('编辑应用配置成功')
			},
		},
	)

	return (
		<Drawer
			width={700}
			title={`${detailDrawerMode === AppDetailDrawerModeEnum.create ? '新增应用配置' : `编辑应用配置 - ${appItem?.info.name}`}`}
			open={open}
			onClose={onClose}
			extra={
				<Space>
					<Button onClick={onClose}>取消</Button>
					<Button
						type="primary"
						loading={confirmLoading}
						onClick={async () => {
							await settingForm.validateFields()

							setConfirmBtnLoading(true)
							try {
								const values = settingForm.getFieldsValue()
								const updatingItem = appItem

								// 获取 Dify 应用信息
								const newDifyApiInstance = new DifyApi({
									user,
									apiBase: values.apiBase,
									apiKey: values.apiKey,
								})
								const difyAppInfo = await newDifyApiInstance.getAppInfo()
								const commonInfo: Omit<IDifyAppItem, 'id'> = {
									info: difyAppInfo,
									requestConfig: {
										apiBase: values.apiBase,
										apiKey: values.apiKey,
									},
									answerForm: {
										enabled: values['answerForm.enabled'],
										feedbackText: values['answerForm.feedbackText'],
									},
									inputParams: {
										enableUpdateAfterCvstStarts: values['inputParams.enableUpdateAfterCvstStarts'],
									},
								}
								if (detailDrawerMode === AppDetailDrawerModeEnum.edit) {
									await updateApp({
										id: updatingItem!.id,
										...commonInfo,
									})
								} else {
									await createApp({
										id: Math.random().toString(),
										...commonInfo,
									})
								}
								confirmCallback?.()
							} catch (error) {
								console.error('保存应用配置失败', error)
								message.error(`保存应用配置失败: ${error}`)
							} finally {
								setConfirmBtnLoading(false)
							}
						}}
					>
						{detailDrawerMode === AppDetailDrawerModeEnum.create ? '确定' : '更新'}
					</Button>
				</Space>
			}
		>
			{detailDrawerMode === AppDetailDrawerModeEnum.edit ? (
				<Form
					labelAlign="left"
					labelCol={{
						span: 5,
					}}
					layout="horizontal"
				>
					<div className="text-base mb-3 flex items-center">
						<div className="h-4 w-1 bg-primary rounded"></div>
						<div className="ml-2 font-semibold">基本信息</div>
					</div>
					<Form.Item label="应用名称">
						<Input
							disabled
							value={appItem?.info.name}
						/>
					</Form.Item>
					<Form.Item label="应用类型">
						<Input
							disabled
							value={appItem?.info.mode || 'Unknown'}
						/>
					</Form.Item>
					<Form.Item label="应用描述">
						<Input
							disabled
							value={appItem?.info.name}
						/>
					</Form.Item>
					<Form.Item label="应用标签">
						{appItem?.info.tags?.length ? (
							<div className="text-default">{appItem.info.tags.join(', ')}</div>
						) : (
							<>无</>
						)}
					</Form.Item>
				</Form>
			) : null}
			<SettingForm formInstance={settingForm} />
		</Drawer>
	)
}
