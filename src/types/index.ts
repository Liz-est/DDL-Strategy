import { IWorkflowNode } from "../components/workflow-logs"

/**
 * 消息对象中的文件 item
 */
export interface IMessageFileItem {
  id: string;
  filename: string;
  type: string;
  url: string;
  mime_type: string;
  size: number;
  transfer_method: string;
  belongs_to: string;
}

export interface IAgentThought {
  /**
   * 每一轮迭代会有一个唯一 ID
   */
  id: string
  /**
   * 任务ID，用于请求跟踪下方的停止响应接口
   */
  task_id: string
  /**
   * 在消息中的位置，第一轮迭代为 1
   */
  position: number
  /**
   * 使用的工具列表，以 ; 分割多个工具
   */
  tool: string
  /**
   * 工具的输入
   */
  tool_input: string
  /**
   * 工具调用的返回结果
   */
  observation: string
  /**
   * 当前 thought 关联的文件 id 列表
   */
  message_files: string[]
  /**
   * 所属消息的 ID
   */
  message_id: string
  /**
   * 对话 ID
   */
  conversation_id: string
}

export interface IAgentMessage {
  workflows?: {
    status?: 'running' | 'finished'
    nodes?: IWorkflowNode[]
  }
  files?: IMessageFileItem[]
  content: string
  agentThoughts?: IAgentThought[]
}