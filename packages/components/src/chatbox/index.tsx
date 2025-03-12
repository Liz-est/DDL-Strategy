import { Bubble, Prompts } from '@ant-design/x';
import { WelcomePlaceholder } from './welcome-placeholder';
import { GetProp } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSender } from '../message-sender';
import { DifyApi, IFile, IMessageItem4Render } from '@dify-chat/api';
import { isMobile } from '@toolkit-fe/where-am-i';
import { isTempId } from '@dify-chat/helpers';
import MessageContent from './message/content';
import MessageFooter from './message/footer';

const roles: GetProp<typeof Bubble.List, 'roles'> = {
  ai: {
    placement: 'start',
    avatar: !isMobile()
      ? { icon: <RobotOutlined />, style: { background: '#fde3cf' } }
      : undefined,
    style: isMobile()
      ? undefined
      : {
          // 减去一个头像的宽度
          maxWidth: 'calc(100% - 44px)',
        },
  },
  user: {
    placement: 'end',
    avatar: !isMobile()
      ? {
          icon: <UserOutlined />,
          style: {
            background: '#87d068',
          },
        }
      : undefined,
    style: isMobile()
      ? undefined
      : {
          // 减去一个头像的宽度
          maxWidth: 'calc(100% - 44px)',
          marginLeft: '44px',
        },
  },
};

export interface ChatboxProps {
  /**
   * 消息列表
   */
  messageItems: IMessageItem4Render[];
  /**
   * 是否正在请求
   */
  isRequesting: boolean;
  /**
   * 下一步问题建议
   */
  nextSuggestions: string[];
  /**
   * 推荐 Item 点击事件
   */
  onPromptsItemClick: GetProp<typeof Prompts, 'onItemClick'>;
  /**
   * 内容提交事件
   * @param value 问题-文本
   * @param files 问题-文件
   */
  onSubmit: (value: string, files?: IFile[]) => void;
  /**
   * 取消读取流
   */
  onCancel: () => void;
  /**
   * 对话 ID
   */
  conversationId: string;
  /**
   * 反馈执行成功后的回调
   */
  feedbackCallback?: (conversationId: string) => void;
  /**
   * 反馈 API
   */
  feedbackApi: DifyApi['feedbackMessage'];
  /**
   * 上传文件 API
   */
  uploadFileApi: DifyApi['uploadFile'];
}

/**
 * 对话内容区
 */
export const Chatbox = (props: ChatboxProps) => {
  const {
    messageItems,
    isRequesting,
    nextSuggestions,
    onPromptsItemClick,
    onSubmit,
    feedbackApi,
    uploadFileApi,
    onCancel,
    conversationId,
    feedbackCallback,
  } = props
  const [content, setContent] = useState('');

  const items: GetProp<typeof Bubble.List, 'items'> = useMemo(() => {
    return messageItems.map((messageItem) => {
      return {
        key: `${messageItem.id}-${messageItem.role}`,
        // 不要开启 loading 和 typing, 否则流式会无效
        // loading: status === 'loading',
        content: messageItem.content,
        messageRender: () => {
          return <MessageContent messageItem={messageItem} />;
        },
        // 用户发送消息时，status 为 local，需要展示为用户头像
        role: messageItem.role === 'local' ? 'user' : messageItem.role,
        footer: messageItem.role === 'ai' && (
          <MessageFooter
            feedbackApi={feedbackApi}
            messageId={messageItem.id}
            messageContent={messageItem.content}
            feedback={{
              rating: messageItem.feedback?.rating,
              callback: () => {
                feedbackCallback?.(conversationId!);
              },
            }}
          />
        ),
      };
    }) as GetProp<typeof Bubble.List, 'items'>;
  }, [messageItems, conversationId]);

  // 监听 items 更新，滚动到最底部
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 延迟更新，优化性能
  const deferredItems = useDeferredValue(items);
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        behavior: 'smooth',
        top: scrollContainerRef.current.scrollHeight,
      });
    }
  }, [deferredItems]);

  return (
    <div className="w-full h-full overflow-hidden my-0 mx-auto box-border flex flex-col gap-4 relative bg-white">
      <div
        className="w-full h-full overflow-auto pt-4 pb-48"
        ref={scrollContainerRef}
      >
        {/* 🌟 欢迎占位 */}
        {!items?.length && isTempId(conversationId) && (
          <WelcomePlaceholder onPromptItemClick={onPromptsItemClick} />
        )}
        {/* 🌟 消息列表 */}
        <Bubble.List
          items={items}
          roles={roles}
          className="flex-1 w-full md:w-3/4 mx-auto px-3 md:px-0 box-border"
        />
        <div
          className="absolute bottom-0 bg-white w-full md:w-3/4 left-1/2"
          style={{
            transform: 'translateX(-50%)',
          }}
        >
          {/* 🌟 提示词 */}
          <Prompts
            items={nextSuggestions?.map((item, index) => {
              return {
                key: index.toString(),
                description: item,
              };
            })}
            onItemClick={onPromptsItemClick}
          />
          {/* 🌟 输入框 */}
          <div className="px-3">
            <MessageSender
              content={content}
              onChange={(value) => setContent(value)}
              onSubmit={(content, files) => {
                if (!content) {
                  return;
                }
                onSubmit(content, files);
                setContent('');
              }}
              isRequesting={isRequesting}
              className="w-full"
              uploadFileApi={uploadFileApi}
              onCancel={onCancel}
            />
          </div>
          <div className="text-gray-400 text-sm text-center h-8 leading-8">
            内容由 AI 生成, 仅供参考
          </div>
        </div>
      </div>
    </div>
  );
};
