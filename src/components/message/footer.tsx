import {
  CopyOutlined,
  DislikeOutlined,
  LikeOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '@toolkit-fe/clipboard';
import { Space, message as antdMessage } from 'antd';
import { DifyApi } from '@dify-chat/api';
import { useRequest, useSetState } from 'ahooks';
import ActionButton from './action-btn';

type IRating = 'like' | 'dislike' | null;

interface IMessageFooterProps {
  /**
   * Dify API 实例
   */
  difyApi: DifyApi;
  /**
   * 消息 ID
   */
  messageId: string;
  /**
   * 消息中的文字内容部分
   */
  messageContent: string;
  /**
   * 用户对消息的反馈
   */
  feedback: {
    /**
     * 用户对消息的点赞/点踩/撤销操作
     */
    rating: IRating;
    /**
     * 操作回调
     */
    callback: () => void;
  };
}

export default function MessageFooter(props: IMessageFooterProps) {
  const {
    messageId,
    messageContent,
    feedback: { rating, callback },
    difyApi,
  } = props;

  const isLiked = rating === 'like';
  const isDisLiked = rating === 'dislike';
  const [loading, setLoading] = useSetState({
    like: false,
    dislike: false,
  });

  /**
   * 用户对消息的反馈
   */
  const { runAsync } = useRequest(
    (rating: IRating) => {
      return difyApi.feedbackMessage({
        messageId: (messageId as string).replace('-answer', ''),
        rating: rating,
        content: '',
      });
    },
    {
      manual: true,
      onSuccess() {
        antdMessage.success('操作成功');
        callback?.();
      },
      onFinally() {
        setLoading({
          like: false,
          dislike: false,
        });
      },
    },
  );

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
        await copyToClipboard(messageContent);
        antdMessage.success('复制成功');
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
        });
        runAsync(isLiked ? null : 'like');
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
        });
        runAsync(isDisLiked ? null : 'dislike');
      },
      active: isDisLiked,
      loading: loading.dislike,
      hidden: false,
    },
  ];

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
  );
}
