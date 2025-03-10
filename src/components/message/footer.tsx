import { CopyOutlined, DislikeOutlined, LikeOutlined, SyncOutlined } from "@ant-design/icons";
import { copyToClipboard } from "@toolkit-fe/clipboard";
import { Button, Space, message as antdMessage } from "antd";
import { DifyApi } from "@dify-chat/api";

interface IMessageFooterProps {
  /**
   * Dify API 实例
   */
  difyApi: DifyApi
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
    rating: 'like' | 'dislike' | null;
    /**
     * 操作回调
     */
    callback: () => void;
  }
}

export default function MessageFooter(props: IMessageFooterProps) {

  const { messageId, messageContent, feedback: { rating, callback }, difyApi } = props

  const isLiked = rating === 'like';
  const isDisLiked = rating === 'dislike';

  return (
    <Space>
      <Button
        color="default"
        variant="text"
        size="small"
        icon={<SyncOutlined />}
      />
      <Button
        color="default"
        variant="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={async () => {
          await copyToClipboard(messageContent);
          antdMessage.success('复制成功')
        }}
      />
      <Button
        color="default"
        variant="text"
        size="small"
        icon={<LikeOutlined className={isLiked ? 'text-primary' : ''} />}
        onClick={async () => {
          await difyApi.feedbackMessage({
            messageId: (messageId as string).replace('-answer', ''),
            rating: isLiked ? null : 'like',
            content: '',
          });
          antdMessage.success('操作成功');
          callback?.()
        }}
      />
      <Button
        color="default"
        variant="text"
        size="small"
        icon={
          <DislikeOutlined
            className={isDisLiked ? 'text-primary' : ''}
          />
        }
        onClick={async () => {
          await difyApi.feedbackMessage({
            messageId: (messageId as string).replace('-answer', ''),
            rating: isDisLiked ? null : 'dislike',
            content: '',
          });
          antdMessage.success('操作成功');
          callback?.()
        }}
      />
    </Space>
  )
}