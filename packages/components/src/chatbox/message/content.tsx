import { WarningOutlined } from '@ant-design/icons';
import { MessageStatus } from '@ant-design/x/es/use-x-chat';
import { IAgentMessage } from '@dify-chat/api';
import ThoughtChain from '../thought-chain';
import WorkflowLogs from './workflow-logs';
import MessageFileList from './file-list';
import { MarkdownRenderer } from '../../markdown-renderer'
import MessageReferrence from './referrence';
import { IRating } from './footer';

/**
 * 用于渲染的消息数据对象
 */
export interface IMessageItem4Render extends IAgentMessage {
  /**
   * 消息 ID
   */
  id: string;
  /**
   * 消息状态
   */
  status: MessageStatus;
  /**
   * 当 status 为 error 时, 返回的错误信息
   */
  error?: string
  /**
   * 角色
   */
  role: 'local' | 'user' | 'ai'
  /**
   * 是否为历史消息
   */
  isHistory?: boolean
  /**
   * 用户对消息的反馈
   */
  feedback?: {
    /**
     * 操作类型
     */
    rating: IRating
  }
}

interface IMessageContentProps {
  /**
   * 消息数据对象
   */
  messageItem: IMessageItem4Render;
}

/**
 * 消息内容展示组件
 */
export default function MessageContent(props: IMessageContentProps) {
  const {
    messageItem: {
      id,
      status,
      error,
      agentThoughts,
      workflows,
      files,
      content,
      retrieverResources,
    },
  } = props;

  // 如果是错误状态，则直接展示错误信息
  if (status === 'error') {
    return (
      <p className="text-red-700">
        <WarningOutlined className="mr-2" />
        <span>{error}</span>
      </p>
    );
  }

  return (
    <>
      {/* Agent 思维链信息 */}
      <ThoughtChain
        uniqueKey={id as string}
        items={agentThoughts}
        className="mt-3"
      />

      {/* 工作流执行日志 */}
      <WorkflowLogs items={workflows?.nodes || []} status={workflows?.status} />

      {/* 消息附件列表 */}
      <MessageFileList files={files} />

      {/* 消息主体文本内容 */}
      <MarkdownRenderer markdownText={content} />

      {/* 引用链接列表 */}
      <MessageReferrence items={retrieverResources} />
    </>
  );
}
