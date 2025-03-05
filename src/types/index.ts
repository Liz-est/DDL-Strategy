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

export interface IAgentMessage {
  workflows?: {
    status?: 'running' | 'finished'
    nodes?: IWorkflowNode[]
  }
  files?: IMessageFileItem[]
  content: string
}