import { CopyOutlined, DislikeOutlined, LikeOutlined, SyncOutlined } from '@ant-design/icons'
import { IRating } from '@dify-chat/api'
import { copyToClipboard } from '@toolkit-fe/clipboard'
import { useRequest, useSetState } from 'ahooks'
import { message as antdMessage, Space } from 'antd'

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
	} = props

	const isLiked = rating === 'like'
	const isDisLiked = rating === 'dislike'
	const [loading, setLoading] = useSetState({
		like: false,
		dislike: false,
	})

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
	 * 操作按钮列表
	 */
	const actionButtons = [
		{
			icon: <SyncOutlined />,
			hidden: true,
		},
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
