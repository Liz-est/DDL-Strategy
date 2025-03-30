import { PlusOutlined } from '@ant-design/icons'
import { XProvider } from '@ant-design/x'
import {
	createDifyApiInstance,
	DifyApi,
	IGetAppInfoResponse,
	IGetAppParametersResponse,
} from '@dify-chat/api'
import { type IConversationItem } from '@dify-chat/components'
import { type IDifyAppItem, IDifyChatContextMultiApp } from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { useMount, useUpdateEffect } from 'ahooks'
import { Button, Form, message, Modal, Spin } from 'antd'
import { createStyles } from 'antd-style'
import { useSearchParams } from 'pure-react-router'
import React, { useEffect, useMemo, useState } from 'react'

import AppList from '@/components/app-list'
import ChatboxWrapper from '@/components/chatbox-wrapper'
import { Logo } from '@/components/logo'
import SettingForm from '@/components/setting-form'
import { DEFAULT_CONVERSATION_NAME } from '@/constants'
import { useMap4Arr } from '@/hooks/use-map-4-arr'
import { colors } from '@/theme/config'

import './../App.css'

const useStyle = createStyles(({ token, css }) => {
	return {
		layout: css`
			background: ${token.colorBgContainer};
			font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
		`,
		menu: css`
			background: ${token.colorBgLayout}80;
		`,
	}
})

const MultiAppLayout: React.FC = () => {
	const searchParams = useSearchParams()
	const { setCurrentAppConfig, ...difyChatContext } = useDifyChat()
	const { user, appService } = difyChatContext as IDifyChatContextMultiApp
	// 创建 Dify API 实例
	const { styles } = useStyle()
	const [difyApi] = useState(
		createDifyApiInstance({
			user,
			apiBase: '',
			apiKey: '',
		}),
	)
	const [appList, setAppList] = useState<IDifyAppItem[]>([])
	const [conversationsItems, setConversationsItems] = useState<IConversationItem[]>([])
	// 优化会话列表查找逻辑（高频操作）
	const conversationMap = useMap4Arr<IConversationItem>(conversationsItems, 'key')
	const [conversationListLoading, setCoversationListLoading] = useState<boolean>(false)
	const [currentConversationId, setCurrentConversationId] = useState<string>()
	const [appInfo, setAppInfo] = useState<IGetAppInfoResponse>()
	const [appParameters, setAppParameters] = useState<IGetAppParametersResponse>()

	const [selectedAppId, setSelectedAppId] = useState<string>('')
	const [appListLoading, setAppListLoading] = useState<boolean>(false)

	/**
	 * 获取应用列表
	 */
	const getAppList = async () => {
		setAppListLoading(true)
		try {
			const result = await appService.getApps()
			console.log('应用列表', result)
			setAppList(result || [])
			return result
		} catch (error) {
			message.error(`获取应用列表失败: ${error}`)
			console.error(error)
		} finally {
			setAppListLoading(false)
		}
	}

	// 初始化获取应用列表
	useMount(() => {
		getAppList().then(result => {
			const idInQuery = searchParams.get('id')
			if (idInQuery) {
				setSelectedAppId(idInQuery as string)
			} else if (!selectedAppId && result?.length) {
				setSelectedAppId(result[0]?.id || '')
			}
		})
	})

	const initAppInfo = async () => {
		setAppInfo(undefined)
		if (!difyApi) {
			return
		}
		// 获取应用信息
		const baseInfo = await difyApi.getAppInfo()
		setAppInfo({
			...baseInfo,
		})
		const appParameters = await difyApi.getAppParameters()
		setAppParameters(appParameters)
	}

	const initApp = () => {
		initAppInfo().then(() => {
			getConversationItems()
		})
		setCurrentConversationId(undefined)
	}

	useUpdateEffect(() => {
		const appItem = appList.find(item => item.id === selectedAppId)
		if (!appItem) {
			return
		}
		setCoversationListLoading(true)
		difyApi.updateOptions({
			user,
			...appItem.requestConfig,
		})
		setCurrentAppConfig(appItem)
		initApp()
	}, [selectedAppId])

	/**
	 * 获取对话列表
	 */
	const getConversationItems = async () => {
		setCoversationListLoading(true)
		try {
			const result = await difyApi?.getConversationList()
			const newItems =
				result?.data?.map(item => {
					return {
						key: item.id,
						label: item.name,
					}
				}) || []
			setConversationsItems(newItems)
			setCurrentConversationId(newItems[0]?.key)
		} catch (error) {
			console.error(error)
			message.error(`获取会话列表失败: ${error}`)
		} finally {
			setCoversationListLoading(false)
		}
	}

	/**
	 * 添加临时新对话(要到第一次服务器响应有效的对话 ID 时才真正地创建完成)
	 */
	const onAddConversation = () => {
		// 创建新对话
		const newKey = `temp_${Math.random()}`
		// 使用函数式更新保证状态一致性（修复潜在竞态条件）
		setConversationsItems(prev => {
			return [
				{
					key: newKey,
					label: DEFAULT_CONVERSATION_NAME,
				},
				...prev,
			]
		})
		setCurrentConversationId(newKey)
	}

	useEffect(() => {
		// 如果对话 ID 不在当前列表中，则刷新一下
		if (currentConversationId && !conversationMap.has(currentConversationId)) {
			getConversationItems()
		}
	}, [currentConversationId])

	const [settingForm] = Form.useForm()

	/**
	 * 开启应用配置弹窗, 支持添加/更新场景
	 */
	const openSettingModal = async (updatingItem?: IDifyAppItem): Promise<void> => {
		settingForm.resetFields()
		if (updatingItem) {
			settingForm.setFieldsValue({
				apiBase: updatingItem.requestConfig.apiBase,
				apiKey: updatingItem.requestConfig.apiKey,
			})
		}
		return new Promise(resolve => {
			Modal.confirm({
				width: 600,
				centered: true,
				title: `${updatingItem ? '更新' : '添加'} Dify 应用配置`,
				content: <SettingForm formInstance={settingForm} />,
				onOk: async () => {
					await settingForm.validateFields()
					const values = settingForm.getFieldsValue()

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
					if (updatingItem) {
						await appService.updateApp({
							id: updatingItem.id,
							...commonInfo,
						})
					} else {
						await appService.addApp({
							id: Math.random().toString(),
							...commonInfo,
						})
					}
					getAppList()
					resolve()
				},
			})
		})
	}

	const conversationName = useMemo(() => {
		return (
			conversationsItems.find(item => item.key === currentConversationId)?.label ||
			DEFAULT_CONVERSATION_NAME
		)
	}, [conversationsItems, currentConversationId])

	return (
		<XProvider theme={{ token: { colorPrimary: colors.primary, colorText: colors.default } }}>
			<div className={`w-full h-screen flex ${styles.layout}`}>
				{/* 左侧边栏 - 小屏幕隐藏 */}
				<div className={`${styles.menu} hidden md:!flex w-72 h-full flex-col`}>
					{/* 🌟 Logo */}
					<Logo />
					{/* 添加应用 */}
					<Button
						onClick={() => openSettingModal()}
						className="h-10 leading-10 border border-solid border-gray-200 w-[calc(100%-24px)] mt-0 mx-3 text-default"
						icon={<PlusOutlined />}
					>
						添加 Dify 应用
					</Button>
					{/* 🌟 应用管理 */}
					<div className="px-3 pb-3 flex-1 overflow-y-auto">
						<Spin spinning={appListLoading}>
							<AppList
								selectedId={selectedAppId}
								onSelectedChange={id => {
									setSelectedAppId(id)
								}}
								list={appList}
								onUpdate={async (id: string, item) => {
									const currentItem = appList.find(item => item.id === id)
									if (!currentItem) {
										message.error('应用不存在')
										return
									}
									return openSettingModal(item)
								}}
								onDelete={async (id: string) => {
									await appService.deleteApp(id)
									getAppList()
								}}
							/>
						</Spin>
					</div>
				</div>

				{/* 右侧聊天窗口 - 移动端全屏 */}
				<div className="flex-1 min-w-0">
					{' '}
					{/* 新增外层容器 */}
					{conversationListLoading ? (
						<div className="w-full h-full flex items-center justify-center">
							<Spin spinning />
						</div>
					) : (
						<ChatboxWrapper
							appConfig={appList?.find(item => item.id === selectedAppId)}
							appInfo={appInfo}
							difyApi={difyApi}
							conversationId={currentConversationId}
							conversationName={conversationName}
							conversationItems={conversationsItems}
							onConversationIdChange={setCurrentConversationId}
							appParameters={appParameters}
							conversationListLoading={conversationListLoading}
							onAddConversation={onAddConversation}
							onItemsChange={setConversationsItems}
							conversationItemsChangeCallback={getConversationItems}
						/>
					)}
				</div>
			</div>
		</XProvider>
	)
}

export default MultiAppLayout
