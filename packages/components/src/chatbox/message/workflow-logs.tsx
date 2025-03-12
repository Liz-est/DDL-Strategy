import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import WorkflowNodeIcon from './workflow-node-icon';
import { Collapse } from 'antd';
import WorkflowNodeDetail from './workflow-node-detail';
import { IAgentMessage, IWorkflowNode } from '@dify-chat/api';



interface IWorkflowLogsProps {
  status: NonNullable<IAgentMessage['workflows']>['status']
  items: IWorkflowNode[]
}

export default function WorkflowLogs(props: IWorkflowLogsProps) {
  const { items, status } = props;

  if (!items?.length) {
    return null; 
  }

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
    <div className='min-w-chat-card'>
      <Collapse items={collapseItems} size="small" className="bg-white" />
    </div>
  )
}
