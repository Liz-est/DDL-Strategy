import { WarningOutlined } from '@ant-design/icons';
import { IMessageItem4Render } from '@dify-chat/api';
import ThoughtChain from '../thought-chain';
import WorkflowLogs from './workflow-logs';
import MessageFileList from './file-list';
import { MarkdownRenderer } from '../../markdown-renderer'
import MessageReferrence from './referrence';

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
      role
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
      {
        files?.length ?
        <div className='mt-3'>
          <MessageFileList files={files} />
        </div>
        : null
      }

      {/* 消息主体文本内容 */}
      <div className={role === 'local' || role === 'user' ? '' : 'md:min-w-chat-card'}>
        <MarkdownRenderer markdownText={content} />
      </div>

      {/* 引用链接列表 */}
      <MessageReferrence items={retrieverResources} />
    </>
  );
}
