import { MenuOutlined, PlusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { XProvider } from '@ant-design/x'
import {
	createDifyApiInstance,
	DifyApi,
	IConversationItem,
	IGetAppInfoResponse,
	IGetAppParametersResponse,
} from '@dify-chat/api'
import { AppInfo, ConversationList } from '@dify-chat/components'
import {
	ConversationsContextProvider,
	IDifyAppItem,
	IDifyChatContextMultiApp,
} from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { isTempId, useIsMobile } from '@dify-chat/helpers'
import { Button, Dropdown, Empty, message, Spin } from 'antd'
import { createStyles } from 'antd-style'
import dayjs from 'dayjs'
import { useSearchParams } from 'pure-react-router'
import React, { useMemo, useState } from 'react'

import ChatboxWrapper from '@/components/chatbox-wrapper'
import { DEFAULT_CONVERSATION_NAME } from '@/constants'
import { useLatest } from '@/hooks/use-latest'
import { colors } from '@/theme/config'

import './../App.css'
import HeaderLayout from './header'

const useStyle = createStyles(({ token, css }) => {
	return {
		layout: css`
			font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
		`,
	}
})

interface IBaseLayoutProps {
	/**
	 * 扩展的 JSX 元素, 如抽屉/弹窗等
	 */
	extComponents?: React.ReactNode
	/**
	 * 自定义中心标题
	 */
	renderCenterTitle?: (appInfo?: IDifyAppItem['info']) => React.ReactNode
	/**
	 * 自定义右侧头部内容
	 */
	renderRightHeader?: () => React.ReactNode
	/**
	 * 获取当前应用配置
	 */
	appConfig: IDifyAppItem
	/**
	 * 初始化应用信息
	 */
	useAppInit: (difyApi: DifyApi, callback: () => void) => void
	/**
	 * 触发配置应用事件
	 */
	handleStartConfig: () => void
	/**
	 * 是否正在加载应用配置
	 */
	initLoading: boolean
}

const BaseLayout = (props: IBaseLayoutProps) => {
	const {
		extComponents,
		appConfig,
		useAppInit,
		renderCenterTitle,
		handleStartConfig,
		initLoading,
	} = props
	const { ...difyChatContext } = useDifyChat()

	const [conversations, setConversations] = useState<IConversationItem[]>([])
	const [currentConversationId, setCurrentConversationId] = useState<string>('')
	const currentConversationInfo = useMemo(() => {
		return conversations.find(item => item.id === currentConversationId)
	}, [conversations, currentConversationId])
	const isMobile = useIsMobile()

	const { user } = difyChatContext as IDifyChatContextMultiApp
	// 创建 Dify API 实例
	const { styles } = useStyle()
	const [difyApi] = useState(
		createDifyApiInstance({
			user,
			apiBase: '',
			apiKey: '',
		}),
	)
	const searchParams = useSearchParams()
	const [conversationListLoading, setCoversationListLoading] = useState<boolean>(false)
	const [appInfo, setAppInfo] = useState<IGetAppInfoResponse>()
	const [appParameters, setAppParameters] = useState<IGetAppParametersResponse>()
	const [appConfigLoading, setAppConfigLoading] = useState(false)
	const latestCurrentConversationId = useLatest(currentConversationId)

	const initAppInfo = async () => {
		setAppInfo(undefined)
		if (!difyApi) {
			return
		}
		setAppConfigLoading(true)
		// 获取应用信息
		try {
			const baseInfo = await difyApi.getAppInfo()
			setAppInfo({
				...baseInfo,
			})
			const appParameters = await difyApi.getAppParameters()
			setAppParameters(appParameters)
		} catch (error) {
			console.error('获取应用信息错误', error)
			return Promise.reject(error)
		} finally {
			setAppConfigLoading(false)
		}
	}

	useAppInit(difyApi, () => {
		setConversations([])
		console.log('setCurrentConversationId: useAppInit', '')
		setCurrentConversationId('')
		setAppInfo(undefined)
		initAppInfo().then(() => {
			getConversationItems().then(() => {
				console.log('ssss', searchParams.get('isNewCvst'))
				const isNewConversation = searchParams.get('isNewCvst') === '1'
				if (isNewConversation) {
					onAddConversation()
				}
			})
		})
	})

	console.log('currentConversationId in render', currentConversationId)

	/**
	 * 获取对话列表
	 */
	const getConversationItems = async (showLoading = true) => {
		if (showLoading) {
			setCoversationListLoading(true)
		}
		try {
			const result = await difyApi?.getConversationList()
			const newItems =
				result?.data?.map(item => {
					return {
						key: item.id,
						label: item.name,
					}
				}) || []
			setConversations(result?.data)
			// 避免闭包问题
			if (!latestCurrentConversationId.current) {
				if (newItems.length) {
					setCurrentConversationId(newItems[0]?.key)
				} else {
					onAddConversation()
				}
			}
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
		setConversations(prev => {
			console.log('setConversations: onAddConversation', [
				{
					id: newKey,
					name: DEFAULT_CONVERSATION_NAME,
					created_at: dayjs().valueOf(),
					inputs: {},
					introduction: '',
					status: 'normal',
					updated_at: dayjs().valueOf(),
				},
				...prev,
			])
			return [
				{
					id: newKey,
					name: DEFAULT_CONVERSATION_NAME,
					created_at: dayjs().valueOf(),
					inputs: {},
					introduction: '',
					status: 'normal',
					updated_at: dayjs().valueOf(),
				},
				...prev,
			]
		})
		console.log('setCurrentConversationId: onAddConversation', newKey)
		setCurrentConversationId(newKey)
	}

	return (
		<XProvider theme={{ token: { colorPrimary: colors.primary, colorText: colors.default } }}>
			<ConversationsContextProvider
				value={{
					conversations,
					setConversations,
					currentConversationId,
					setCurrentConversationId,
					currentConversationInfo,
				}}
			>
				<div
					className={`w-full h-screen ${styles.layout} flex flex-col overflow-hidden bg-[#eff0f5]`}
				>
					{/* 头部 */}
					<HeaderLayout
						title={renderCenterTitle?.(appInfo)}
						rightIcon={
							isMobile ? (
								<Dropdown
									menu={{
										items: [
											{
												key: 'add_conversation',
												icon: <PlusCircleOutlined />,
												label: '新建对话',
												onClick: () => {
													onAddConversation()
												},
											},
											{
												type: 'divider',
											},
											{
												type: 'group',
												label: '历史对话',
												children: conversations?.length
													? conversations.map(item => {
															return {
																key: item.id,
																label: item.name,
																onClick: () => {
																	setCurrentConversationId(item.id)
																},
															}
														})
													: [
															{
																key: 'no_conversation',
																label: '暂无历史对话',
																disabled: true,
															},
														],
											},
										],
									}}
								>
									<MenuOutlined className="text-xl" />
								</Dropdown>
							) : null
						}
					/>

					{/* Main */}
					<div className="flex-1 overflow-hidden flex rounded-3xl bg-white">
						{appConfigLoading || initLoading ? (
							<div className="absolute w-full h-full left-0 top-0 z-50 flex items-center justify-center">
								<Spin spinning />
							</div>
						) : appConfig ? (
							<>
								{/* 左侧对话列表 */}
								<div
									className={`hidden md:!flex w-72 h-full flex-col border-0 border-r border-solid border-r-[#eff0f5]`}
								>
									{appInfo ? <AppInfo info={appInfo!} /> : null}
									{/* 添加会话 */}
									{appConfig ? (
										<Button
											onClick={() => {
												onAddConversation()
											}}
											className="h-10 leading-10 rounded-lg border border-solid border-gray-200 mt-3 mx-4 text-default "
											icon={<PlusOutlined />}
										>
											新增对话
										</Button>
									) : null}
									{/* 🌟 对话管理 */}
									<div className="px-4 mt-3">
										<Spin spinning={conversationListLoading}>
											{conversations?.length ? (
												<ConversationList
													renameConversationPromise={async (
														conversationId: string,
														name: string,
													) => {
														await difyApi?.renameConversation({
															conversation_id: conversationId,
															name,
														})
														getConversationItems()
													}}
													deleteConversationPromise={async (conversationId: string) => {
														if (isTempId(conversationId)) {
															setConversations(prev => {
																const newConversations = prev.filter(
																	item => item.id !== conversationId,
																)
																if (
																	conversationId === currentConversationId &&
																	newConversations.length
																) {
																	console.log(
																		'setCurrentConversationId: deleteConversationPromise',
																		newConversations[0].id,
																	)
																	setCurrentConversationId(newConversations[0].id)
																}
																return newConversations
															})
														} else {
															await difyApi?.deleteConversation(conversationId)
															getConversationItems()
															return Promise.resolve()
														}
													}}
													items={conversations.map(item => {
														return {
															key: item.id,
															label: item.name,
														}
													})}
													activeKey={currentConversationId}
													onActiveChange={id => {
														console.log('setCurrentConversationId: onActiveChange', id)
														setCurrentConversationId(id)
													}}
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<Empty
														className="pt-6"
														description="暂无会话"
													/>
												</div>
											)}
										</Spin>
									</div>
								</div>

								{/* 右侧聊天窗口 - 移动端全屏 */}
								<div className="flex-1 min-w-0 flex flex-col overflow-hidden">
									<ChatboxWrapper
										appConfig={appConfig}
										appConfigLoading={appConfigLoading}
										appInfo={appInfo}
										difyApi={difyApi}
										appParameters={appParameters}
										conversationListLoading={conversationListLoading}
										onAddConversation={onAddConversation}
										conversationItemsChangeCallback={() => getConversationItems(false)}
									/>
								</div>
							</>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<Empty
									description="暂无 Dify 应用配置"
									className="text-base"
								>
									<Button
										size="large"
										type="primary"
										onClick={handleStartConfig}
									>
										开始配置
									</Button>
								</Empty>
							</div>
						)}
					</div>
				</div>

				{extComponents}
			</ConversationsContextProvider>
		</XProvider>
	)
}

export default BaseLayout
