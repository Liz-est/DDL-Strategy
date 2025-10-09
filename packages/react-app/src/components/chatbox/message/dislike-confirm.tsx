import { IRating } from '@dify-chat/api'
import { Input, Modal } from 'antd'
import { useState } from 'react'

import LucideIcon from '@/components/lucide-icon'

/**
 * 点踩确认
 */
export default function DislikeConfirm(props: {
	isDisLiked: boolean
	runFeedback: (type: IRating, reason?: string) => void
}) {
	const { isDisLiked, runFeedback } = props
	const [dislikeReason, setDislikeReason] = useState('')
	const [modalOpen, setModalOpen] = useState(false)
	const [confirmLoading, setConfirmLoading] = useState(false)

	return (
		<>
			<LucideIcon
				name="thumbs-down"
				className={
					isDisLiked ? 'text-[var(--theme-primary-color)]' : 'text-[var(--theme-text-color)]'
				}
				onClick={() => {
					if (isDisLiked) {
						return
					}
					setModalOpen(true)
				}}
			/>

			<Modal
				width={360}
				title="感谢反馈"
				open={modalOpen}
				centered
				onOk={async () => {
					setConfirmLoading(true)
					await runFeedback(isDisLiked ? null : 'dislike', dislikeReason)
					setConfirmLoading(false)
					setDislikeReason('')
					setModalOpen(false)
				}}
				onCancel={() => {
					setDislikeReason('')
					setModalOpen(false)
				}}
				confirmLoading={confirmLoading}
			>
				<div>
					<div className="text-desc mb-2">请告知我们此回复有何不妥之处。</div>
					<Input.TextArea
						autoSize={{
							minRows: 3,
							maxRows: 5,
						}}
						value={dislikeReason}
						onChange={e => {
							setDislikeReason(e.target.value)
						}}
						placeholder="请输入"
						className="h-12 w-full box-border px-3 py-2 border border-solid border-[var(--theme-border-color)] rounded-md"
					/>
				</div>
			</Modal>
		</>
	)
}
