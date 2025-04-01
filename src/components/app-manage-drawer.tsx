import { DeleteOutlined } from '@ant-design/icons'
import { DifyApi } from '@dify-chat/api'
import { IDifyAppItem, IDifyChatContextMultiApp, useDifyChat } from '@dify-chat/core'
import { useRequest } from 'ahooks'
import {
	Button,
	Col,
	Drawer,
	DrawerProps,
	Empty,
	Form,
	Input,
	message,
	Popconfirm,
	Row,
	Space,
	Spin,
} from 'antd'
import { useEffect, useState } from 'react'

import SettingForm from './setting-form'

interface IAppManagerDrawerProps extends DrawerProps {
	/**
	 * 当前激活的应用 ID
	 */
	activeAppId?: string
}

enum AppDetailDrawerModeEnum {
	create = 'create',
	edit = 'edit',
}

export default function AppManageDrawer(props: IAppManagerDrawerProps) {
	const { user, appService } = useDifyChat() as IDifyChatContextMultiApp
	const [selectedAppId, setSelectedAppId] = useState<string>()
	const [detailDrawerVisible, setDetailDrawerVisible] = useState(false)
	const [settingForm] = Form.useForm()
	const [detailDrawerMode, setDetailDrawerMode] = useState<AppDetailDrawerModeEnum>()

	const {
		runAsync: getAppList,
		data: appList,
		loading: appListLoading,
	} = useRequest(
		() => {
			return appService.getApps()
		},
		{
			manual: true,
		},
	)

	const { runAsync: createApp, loading: createAppLoading } = useRequest(
		async (appInfo: IDifyAppItem) => {
			return appService.addApp(appInfo)
		},
		{
			manual: true,
			onSuccess: () => {
				setDetailDrawerVisible(false)
				message.success('创建应用成功')
				getAppList()
			},
		},
	)

	const { runAsync: updateApp, loading: updateAppLoading } = useRequest(
		async (appInfo: IDifyAppItem) => {
			return appService.updateApp(appInfo)
		},
		{
			manual: true,
			onSuccess: () => {
				setDetailDrawerVisible(false)
				message.success('更新应用成功')
				getAppList()
			},
		},
	)

	const { activeAppId, ...drawerProps } = props

	useEffect(() => {
		getAppList()
	}, [props.open])

	useEffect(() => {
		console.log('detailDrawerVisible', detailDrawerVisible)
		if (!detailDrawerVisible) {
			settingForm.resetFields()
		}
	}, [detailDrawerVisible])

	console.log('appList', appList)

	const selectedAppItem = appList?.find(item => item.id === selectedAppId)

	console.log('updateAppLoading', updateAppLoading)

	return (
		<Drawer
			width={700}
			title="应用配置管理"
			{...drawerProps}
		>
			<div className="w-full h-full overflow-hidden flex flex-col">
				{/* 🌟 应用管理 */}
				<div className="px-3 pb-3 flex-1 overflow-y-auto">
					<Spin spinning={appListLoading}>
						<Row gutter={16}>
							{appList?.length ? (
								appList?.map(item => {
									return (
										<Col
											span={12}
											key={item.id}
										>
											<div
												className={`p-3 bg-white mt-3 border border-solid border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:text-primary`}
												onClick={() => {
													console.log('item', item)
													setSelectedAppId(item.id)
													settingForm.setFieldsValue({
														apiBase: item.requestConfig.apiBase,
														apiKey: item.requestConfig.apiKey,
														'answerForm.enabled': item.answerForm?.enabled || false,
														'answerForm.feedbackText': item.answerForm?.feedbackText || '',
													})
													console.log('form', settingForm.getFieldsValue())
													setDetailDrawerMode(AppDetailDrawerModeEnum.edit)
													setDetailDrawerVisible(true)
												}}
											>
												<div className="w-full flex items-center overflow-hidden">
													<div className="flex-1 font-semibold truncate">
														{activeAppId === item.id && '【当前】'}
														{item.info.name}
													</div>
													<Space className="inline-flex items-center">
														<Popconfirm
															cancelText="取消"
															okText="确定"
															title="确定删除应用吗？"
															onConfirm={async () => {
																await appService.deleteApp(item.id)
																message.success('删除应用成功')
																getAppList()
															}}
														>
															<DeleteOutlined
																onClick={e => e.stopPropagation()}
																className="p-0 text-red-500"
															/>
														</Popconfirm>
													</Space>
												</div>
												<div
													title={item.info.description}
													className="truncate text-sm mt-2 text-desc h-6 leading-6"
												>
													{item.info.description}
												</div>
												<div
													className="mt-3 text-desc truncate"
													title={item.info.tags.join(', ')}
												>
													标签：
													{item.info.tags?.length ? item.info.tags.join(', ') : <>无</>}
												</div>
											</div>
										</Col>
									)
								})
							) : (
								<Empty description="暂无应用" />
							)}
						</Row>
					</Spin>
				</div>
				<Button
					type="primary"
					size="large"
					block
					onClick={() => {
						setSelectedAppId('')
						setDetailDrawerMode(AppDetailDrawerModeEnum.create)
						settingForm.resetFields()
						setDetailDrawerVisible(true)
					}}
				>
					添加应用
				</Button>
			</div>

			<Drawer
				width={600}
				title={`${detailDrawerMode === AppDetailDrawerModeEnum.create ? '添加应用配置' : `应用配置详情 - ${selectedAppItem?.info.name}`}`}
				open={detailDrawerVisible}
				onClose={() => setDetailDrawerVisible(false)}
				extra={
					<Space>
						<Button onClick={() => setDetailDrawerVisible(false)}>取消</Button>
						<Button
							type="primary"
							loading={createAppLoading || updateAppLoading}
							onClick={async () => {
								await settingForm.validateFields()
								const values = settingForm.getFieldsValue()
								const updatingItem = appList?.find(item => item.id === selectedAppId)

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
							}}
						>
							{detailDrawerMode === AppDetailDrawerModeEnum.create ? '确定' : '更新'}
						</Button>
					</Space>
				}
			>
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
							value={selectedAppItem?.info.name}
						/>
					</Form.Item>
					<Form.Item label="应用描述">
						<Input
							disabled
							value={selectedAppItem?.info.name}
						/>
					</Form.Item>
					<Form.Item label="应用标签">
						{selectedAppItem?.info.tags?.length ? (
							<div className="text-default">{selectedAppItem.info.tags.join(', ')}</div>
						) : (
							<>无</>
						)}
					</Form.Item>
				</Form>
				<SettingForm formInstance={settingForm} />
			</Drawer>
		</Drawer>
	)
}

export const useAppManageDrawer = () => {
	const [drawerVisible, setDrawerVisible] = useState(false)

	return {
		AppManageDrawer: <AppManageDrawer open={drawerVisible} />,
		drawerVisible,
		setDrawerVisible,
	}
}
