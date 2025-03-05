import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import WorkflowNodeIcon from './workflow-node-icon';
import { Collapse } from 'antd';
import WorkflowNodeDetail from './workflow-node-detail';
import { IAgentMessage } from '../types';

/**
 * 工作流节点数据
 */
export interface IWorkflowNode {
  /**
   * 步骤 ID
   */
  id: string;
  /**
   * 步骤标题
   */
  title: string;
  /**
   * 运行状态
   */
  status: 'init' | 'running' | 'success' | 'error';
  /**
   * 节点类型 question-classifier/问题分类器
   */
  type: 'question-classifier';
  /**
   * 节点输入 序列化的 JSON 数据
   */
  inputs: string;
  /**
   * 处理过程 序列化的 JSON 数据
   */
  process_data: string;
  /**
   * 节点输出 序列化的 JSON 数据
   */
  outputs: string;
  /**
   * 耗时 单位秒
   */
  elapsed_time: number;
  /**
   * 执行元数据
   */
  execution_metadata: {
    /**
     * 总共消耗 tokens
     */
    total_tokens: number;
    /**
     * 总共消耗金额
     */
    total_price: number;
    /**
     * 货币单位
     */
    currency: string;
  };
}

interface IWorkflowLogsProps {
  status: NonNullable<IAgentMessage['workflows']>['status']
  items: IWorkflowNode[];
}

export default function WorkflowLogs(props: IWorkflowLogsProps) {
  const { items, status } = props;

  const collapseItems = [
    {
      key: 'workflow',
      label: <div className='flex items-center justify-between'>
        <div>工作流</div>
        {
          status === 'running' ?
              <LoadingOutlined />
            :
            status === 'finished' ?
              <div className='text-green-700 flex items-center'>
                <span className='mr-2'>
                  成功
                </span>
                <CheckCircleOutlined className='text-green-700' />
              </div>
              : null
        }
      </div>,
      children: (
        <Collapse
          size="small"
          items={items.map((item) => {
            const totalTokens = item.execution_metadata?.total_tokens;
            return {
              key: item.id,
              label: (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="mr-2">
                      <WorkflowNodeIcon type={item.type} />
                    </div>
                    <div>{item.title}</div>
                  </div>
                  <div className="flex items-center">
                    {
                      item.status === 'success' ?
                        <>
                          <div className="mr-3">
                            {item.elapsed_time?.toFixed(3)} 秒
                          </div>
                          <div className="mr-3">
                            {totalTokens ? `${totalTokens} tokens` : ''}
                          </div>
                        </>
                        : null
                    }
                    {item.status === 'success' ? (
                      <CheckCircleOutlined className="text-green-700" />
                    ) : item.status === 'error' ? (
                      <CloseCircleOutlined className="text-red-700" />
                    ) : item.status === 'running' ? (
                      <LoadingOutlined />
                    ) : (
                      <InfoOutlined />
                    )}
                  </div>
                </div>
              ),
              children: (
                <div>
                  <WorkflowNodeDetail
                    title="输入"
                    originalContent={item.inputs}
                  />
                  <WorkflowNodeDetail
                    title="处理过程"
                    originalContent={item.process_data}
                  />
                  <WorkflowNodeDetail
                    title="输出"
                    originalContent={item.outputs}
                  />
                </div>
              ),
            };
          })}
        >
          { }
        </Collapse>
      ),
    },
  ];

  return (
    <div className='min-w-96'>
      <Collapse items={collapseItems} size="small" className="bg-white" />
    </div>
  )
}
