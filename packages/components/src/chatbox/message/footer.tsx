import {
	CopyOutlined,
	DislikeOutlined,
	LikeOutlined,
	MutedOutlined,
	SoundOutlined,
	SyncOutlined,
} from '@ant-design/icons'
import { DifyApi, IGetAppParametersResponse, IRating } from '@dify-chat/api'
import { copyToClipboard } from '@toolkit-fe/clipboard'
import { useRequest, useSetState } from 'ahooks'
import { message as antdMessage, Space } from 'antd'
import { useState } from 'react'

import ActionButton from './action-btn'

interface IMessageFooterProps {
	/**
	 * 反馈 API
	 */
	feedbackApi: (params: {
		/**
		 * 反馈的消息 ID
		 */
		messageId: string
		/**
		 * 反馈操作类型
		 */
		rating: IRating
		/**
		 * 反馈文本内容
		 */
		content: string
	}) => Promise<unknown>
	/**
	 * 文本转语音 API
	 */
	ttsApi: DifyApi['text2Audio']
	/**
	 * 消息 ID
	 */
	messageId: string
	/**
	 * 消息中的文字内容部分
	 */
	messageContent: string
	/**
	 * 用户对消息的反馈
	 */
	feedback: {
		/**
		 * 用户对消息的点赞/点踩/撤销操作
		 */
		rating?: IRating
		/**
		 * 操作回调
		 */
		callback: () => void
	}
	/**
	 * TTS 配置
	 */
	ttsConfig?: IGetAppParametersResponse['text_to_speech']
}

/**
 * 消息底部操作区
 */
export default function MessageFooter(props: IMessageFooterProps) {
	const {
		messageId,
		messageContent,
		feedback: { rating, callback },
		feedbackApi,
		ttsApi,
		ttsConfig,
	} = props

	const isLiked = rating === 'like'
	const isDisLiked = rating === 'dislike'
	const [loading, setLoading] = useSetState({
		like: false,
		dislike: false,
	})
	const [ttsPlaying, setTTSPlaying] = useState(false)
	const [cachedAudioUrl, setCachedAudioUrl] = useState<string>('')

	/**
	 * 用户对消息的反馈
	 */
	const { runAsync } = useRequest(
		(rating: IRating) => {
			return feedbackApi({
				messageId: (messageId as string).replace('-answer', ''),
				rating: rating,
				content: '',
			})
		},
		{
			manual: true,
			onSuccess() {
				antdMessage.success('操作成功')
				callback?.()
			},
			onFinally() {
				setLoading({
					like: false,
					dislike: false,
				})
			},
		},
	)

	/**
	 * 播放音频
	 * @param audioUrl 音频 URL
	 */
	const playAudio = async (audioUrl: string) => {
		const audio = new Audio()
		audio.src = audioUrl
		audio.play()
		setTTSPlaying(true)
		audio.addEventListener('ended', () => {
			// 播放完成后释放 URL 对象
			// URL.revokeObjectURL(audioUrl);
			setTTSPlaying(false)
		})
	}

	/**
	 * 文本转语音
	 */
	const { runAsync: runTTS, loading: ttsLoading } = useRequest(
		(text: string) => {
			return ttsApi({
				text,
			})
				.then(response => response.blob())
				.then(blob => {
					const audioUrl = URL.createObjectURL(blob)
					setCachedAudioUrl(audioUrl)
					playAudio(audioUrl)
				})
		},
		{
			manual: true,
		},
	)

	/**
	 * 操作按钮列表
	 */
	const actionButtons = [
		// 重新生成回复
		{
			icon: <SyncOutlined />,
			hidden: true,
		},
		// 复制内容
		{
			icon: <CopyOutlined />,
			onClick: async () => {
				await copyToClipboard(messageContent)
				antdMessage.success('复制成功')
			},
			active: false,
			loading: false,
			hidden: false,
		},
		// 点赞
		{
			icon: <LikeOutlined />,
			onClick: () => {
				setLoading({
					like: true,
				})
				runAsync(isLiked ? null : 'like')
			},
			active: isLiked,
			loading: loading.like,
			hidden: false,
		},
		// 点踩
		{
			icon: <DislikeOutlined />,
			onClick: () => {
				setLoading({
					dislike: true,
				})
				runAsync(isDisLiked ? null : 'dislike')
			},
			active: isDisLiked,
			loading: loading.dislike,
			hidden: false,
		},
		// 文本转语音
		{
			icon: ttsPlaying ? <SoundOutlined /> : <MutedOutlined />,
			onClick: () => {
				if (cachedAudioUrl) {
					playAudio(cachedAudioUrl)
				} else {
					runTTS(messageContent)
				}
			},
			active: ttsPlaying,
			loading: ttsLoading,
			hidden: !ttsConfig?.enabled,
		},
	]

	return (
		<Space>
			{actionButtons.map(
				(buttonProps, index) =>
					!buttonProps.hidden && (
						<ActionButton
							key={index}
							icon={buttonProps.icon}
							onClick={buttonProps.onClick}
							active={buttonProps.active}
							loading={buttonProps.loading}
						/>
					),
			)}
		</Space>
	)
}
