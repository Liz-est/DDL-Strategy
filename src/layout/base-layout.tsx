import { PlusOutlined } from '@ant-design/icons'
import { XProvider } from '@ant-design/x'
import {
	createDifyApiInstance,
	DifyApi,
	IGetAppInfoResponse,
	IGetAppParametersResponse,
} from '@dify-chat/api'
import { ConversationList, type IConversationItem } from '@dify-chat/components'
import { IDifyAppItem, IDifyChatContextMultiApp } from '@dify-chat/core'
import { useDifyChat } from '@dify-chat/core'
import { Button, Divider, Empty, message, Space, Spin } from 'antd'
import { createStyles } from 'antd-style'
import React, { useEffect, useMemo, useState } from 'react'

import ChatboxWrapper from '@/components/chatbox-wrapper'
import { GithubIcon, Logo } from '@/components/logo'
import { DEFAULT_CONVERSATION_NAME } from '@/constants'
import { useMap4Arr } from '@/hooks/use-map-4-arr'
import { colors } from '@/theme/config'

import './../App.css'
import CenterTitleWrapper from './components/center-title-wrapper'

const useStyle = createStyles(({ token, css }) => {
	return {
		layout: css`
			font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
		`,
		menu: css`
			background: ${token.colorBgLayout}80;
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
	renderCenterTitle?: (appInfo: IDifyAppItem['info']) => React.ReactNode
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
}

const BaseLayout = (props: IBaseLayoutProps) => {
	const { extComponents, appConfig, useAppInit, renderCenterTitle, handleStartConfig } = props
	const { ...difyChatContext } = useDifyChat()
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
	const [conversationsItems, setConversationsItems] = useState<IConversationItem[]>([])
	// 优化会话列表查找逻辑（高频操作）
	const conversationMap = useMap4Arr<IConversationItem>(conversationsItems, 'key')
	const [conversationListLoading, setCoversationListLoading] = useState<boolean>(false)
	const [currentConversationId, setCurrentConversationId] = useState<string>()
	const [appInfo, setAppInfo] = useState<IGetAppInfoResponse>()
	const [appParameters, setAppParameters] = useState<IGetAppParametersResponse>()

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

	useAppInit(difyApi, () => {
		initAppInfo().then(() => {
			getConversationItems()
		})
		setCurrentConversationId(undefined)
	})

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

	const conversationName = useMemo(() => {
		return (
			conversationsItems.find(item => item.key === currentConversationId)?.label ||
			DEFAULT_CONVERSATION_NAME
		)
	}, [conversationsItems, currentConversationId])

	useEffect(() => {
		if (!appConfig) {
			setConversationsItems([])
			setAppInfo(undefined)
			setCurrentConversationId('')
		}
	}, [appConfig])

	return (
		<XProvider theme={{ token: { colorPrimary: colors.primary, colorText: colors.default } }}>
			<div
				className={`w-full h-screen ${styles.layout} flex flex-col overflow-hidden bg-[#eff0f5]`}
			>
				{/* 左侧边栏 - 小屏幕隐藏 */}
				<div className="hidden md:!flex items-center justify-between px-6">
					{/* 🌟 Logo */}
					<div className={`flex-1 overflow-hidden ${appConfig ? '' : 'shadow-sm'}`}>
						<Logo hideGithubIcon />
					</div>

					<CenterTitleWrapper>
						{renderCenterTitle ? renderCenterTitle(appInfo!) : null}
					</CenterTitleWrapper>

					{/* 自定义头部 */}
					<div className="flex-1 overflow-hidden">
						<div className="flex items-center justify-end text-sm">
							<Space split={<Divider type="vertical" />}>
								<GithubIcon />
							</Space>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-hidden flex rounded-3xl bg-white">
					{appConfig ? (
						<>
							{/* 左侧对话列表 */}
							<div className={`${styles.menu} hidden md:!flex w-72 h-full flex-col`}>
								{/* 添加会话 */}
								{appConfig ? (
									<Button
										onClick={() => onAddConversation()}
										className="h-10 leading-10 border border-solid border-gray-200 w-[calc(100%-24px)] mt-3 mx-3 text-default"
										icon={<PlusOutlined />}
									>
										新增对话
									</Button>
								) : null}
								{/* 🌟 对话管理 */}
								<div className="px-3">
									<Spin spinning={conversationListLoading}>
										{conversationsItems?.length ? (
											<ConversationList
												renameConversationPromise={(conversationId: string, name: string) =>
													difyApi?.renameConversation({
														conversation_id: conversationId,
														name,
													})
												}
												deleteConversationPromise={difyApi?.deleteConversation}
												items={conversationsItems}
												activeKey={currentConversationId}
												onActiveChange={id => setCurrentConversationId(id)}
												onItemsChange={setConversationsItems}
												refreshItems={getConversationItems}
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
								{appConfig ? (
									conversationListLoading ? (
										<div className="w-full flex-1 flex items-center justify-center">
											<Spin spinning />
										</div>
									) : (
										<ChatboxWrapper
											appConfig={appConfig}
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
									)
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<Empty description="请先配置 Dify 应用">
											<Button
												type="primary"
												onClick={handleStartConfig}
											>
												开始配置
											</Button>
										</Empty>
									</div>
								)}
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
		</XProvider>
	)
}

export default BaseLayout
