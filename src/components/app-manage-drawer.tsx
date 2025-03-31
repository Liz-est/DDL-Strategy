import { Button, Col, Drawer, DrawerProps, Dropdown, Form, message, Popconfirm, Row, Space, Spin, Tag, Tooltip } from "antd";
import { IDifyAppItem, IDifyChatContextMultiApp, useDifyChat } from "@dify-chat/core";
import { useEffect, useState } from "react";
import { DeleteOutlined, EditOutlined, MoreOutlined, SelectOutlined } from "@ant-design/icons";
import { useRequest, useUpdateEffect } from "ahooks";
import SettingForm from "./setting-form";
import { DifyApi } from "@dify-chat/api";

interface IAppManagerDrawerProps extends DrawerProps {
	// appListLoading?: boolean;
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

	const { runAsync: getAppList, data: appList, loading: appListLoading } = useRequest(() => {
		return appService.getApps()
	}, {
		manual: true
	})

	const { runAsync: createApp, loading: createAppLoading } = useRequest(async (appInfo: IDifyAppItem) => {
		return appService.addApp(appInfo)
	}, {
		manual: true,
		onSuccess: () => {
			setDetailDrawerVisible(false)
			message.success('创建应用成功')
			getAppList()
		}
	})

	const { runAsync: updateApp, loading: updateAppLoading } = useRequest(async (appInfo: IDifyAppItem) => {
		return appService.updateApp(appInfo)
	}, {
		manual: true,
		onSuccess: () => {
			setDetailDrawerVisible(false)
			message.success('更新应用成功')
			getAppList()
		}
	})



	const {
		activeAppId,
		...drawerProps
	} = props

	useEffect(() => {
		getAppList()
	}, [props.open])

	useEffect(()=>{
		if (!detailDrawerVisible) {
			settingForm.resetFields()
		}
	},[detailDrawerVisible])

	console.log('appList', appList)

	return (
		<Drawer width={700} title='应用管理' {...drawerProps}>
			<div className="w-full h-full overflow-hidden flex flex-col">
				{/* 🌟 应用管理 */}
				<div className="px-3 pb-3 flex-1 overflow-y-auto">
					<Spin spinning={appListLoading}>
						<Row gutter={16}>
							{
								appList?.map((item) => {
									const isSelected = selectedAppId === item.id
									return (
										<Col
											span={12}
											key={item.id}
										>
											<div
												className={`p-3 bg-white mt-3 border border-solid border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:text-primary ${isSelected ? 'text-primary border-primary bg-gradient-to-r from-cyan-50 to-blue-50' : ''}`}
											>
												<div className="w-full flex items-center overflow-hidden">
													<div
														className="flex-1 font-semibold truncate"
													>
														{item.info.name}
													</div>
													<Space className="inline-flex items-center">
														<EditOutlined className="px-0" onClick={() => {
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
														}} />
														<Popconfirm cancelText='取消' okText='确定' title='确定删除应用吗？' onConfirm={async () => {
															await appService.deleteApp(item.id)
															message.success('删除应用成功')
															getAppList()
														}}>
															<DeleteOutlined className="p-0 text-red-500" />
														</Popconfirm>
														<Tooltip title='切换为当前应用'>
														<SelectOutlined className={`p-0 ${activeAppId===item.id?'text-primary':'text-default'}`} />
														</Tooltip>
													</Space>
												</div>
												<div
													className="flex items-center overflow-hidden"
												>
													<div className="flex-1 truncate text-sm mt-2 text-desc">
													{item.info.description}
													</div>
												</div>
												<div className="flex flex-wrap items-center mt-3">
													标签：
												{item.info.tags
															? item.info.tags.map(tag => {
																return (
																	<Tag
																		key={tag}
																		className="mr-2"
																	>
																		{tag}
																	</Tag>
																)
															})
															: null}
												</div>
											</div>
										</Col>
									)
								})
							}
						</Row>
					</Spin>
				</div>
				<Button type='primary' size="large" block onClick={() => {
					setDetailDrawerMode(AppDetailDrawerModeEnum.create)
					setDetailDrawerVisible(true)
				}}>新增应用</Button>
			</div>

			<Drawer width={600} title={`${detailDrawerMode === AppDetailDrawerModeEnum.create ? '新建' : '编辑'}应用`} open={detailDrawerVisible}
				onClose={() => setDetailDrawerVisible(false)}
				extra={
					<Space>
						<Button onClick={() => setDetailDrawerVisible(false)}>取消</Button>
						<Button type="primary" loading={createAppLoading || updateAppLoading} onClick={async () => {
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
									...commonInfo
								})
							}
						}}>
							确定
						</Button>
					</Space>
				}
			>
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
		setDrawerVisible
	}
}