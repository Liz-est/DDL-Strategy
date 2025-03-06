import {
  MessageOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  FormItemProps,
  GetProp,
  Input,
  Select,
  Spin,
} from 'antd';
import { Chatbox } from './chatbox';
import {
  DifyApi,
  IFile,
  IGetAppInfoResponse,
  IGetAppParametersResponse,
} from '../utils/dify-api';
import { useEffect, useRef, useState } from 'react';
import {
  Bubble,
  Prompts,
  useXAgent,
  useXChat,
  XStream,
} from '@ant-design/x';
import { RESPONSE_MODE, USER } from '../config';
import { MessageInfo } from '@ant-design/x/es/use-x-chat';
import { isTempId } from '../utils/utils';
import { DIFY_INFO } from '../utils/vars';
import { gte } from 'semver'
import WorkflowLogs, { IWorkflowNode } from './workflow-logs';
import { useLatest } from '../hooks/use-latest';
import { IAgentMessage, IAgentThought, IMessageFileItem } from '../types';
import ThoughtChain from './thought-chain';
import MdRender from './md-render';
import AppInfo from './app-info';
import MessageFooter from './message/footer';

interface IConversationEntryFormItem extends FormItemProps {
  type: 'input' | 'select';
}

interface IChatboxWrapperProps {
  /**
   * 应用信息
   */
  appInfo?: IGetAppInfoResponse;
  /**
   * 应用参数
   */
  appParameters?: IGetAppParametersResponse;
  /**
   * Dify API 实例
   */
  difyApi: DifyApi;
  /**
   * 当前对话 ID
   */
  conversationId?: string;
  /**
   * 当前对话名称
   */
  conversationName: string;
  /**
   * 对话 ID 变更时触发的回调函数
   * @param id 即将变更的对话 ID
   */
  onConversationIdChange: (id: string) => void;
}

export default function ChatboxWrapper(props: IChatboxWrapperProps) {
  const [entryForm] = Form.useForm();

  const {
    appInfo,
    appParameters,
    difyApi,
    conversationId,
    conversationName,
    onConversationIdChange,
  } = props;
  const [initLoading, setInitLoading] = useState<boolean>(false);
  const [target, setTarget] = useState('');
  const [historyMessages, setHistoryMessages] = useState<MessageInfo<IAgentMessage>[]>(
    [],
  );
  const [userInputItems, setUserInputItems] = useState<
    IConversationEntryFormItem[]
  >([]);
  const [formVisible, setFormVisible] = useState<boolean>(false);

  const [nextSuggestions, setNextSuggestions] = useState<string[]>([]);
  // 定义 ref, 用于获取最新的 conversationId
  const latestProps = useLatest({
    conversationId,
    difyApi
  })

  const filesRef = useRef<IFile[]>([]);

  /**
   * 获取下一轮问题建议
   */
  const getNextSuggestions = async (message_id: string) => {
    const result = await difyApi.getNextSuggestions({ message_id });
    setNextSuggestions(result.data);
  };

  const [agent] = useXAgent<IAgentMessage>({
    request: async ({ message }, { onSuccess, onUpdate, onError }) => {

      // 发送消息
      const response = await latestProps.current.difyApi.sendMessage({
        inputs: {
          target,
        },
        conversation_id: !isTempId(latestProps.current.conversationId)
          ? latestProps.current.conversationId
          : undefined,
        files: filesRef.current || [],
        user: USER,
        response_mode: RESPONSE_MODE,
        query: message?.content as string,
      });

      let result = '';
      const files: IMessageFileItem[] = []
      const workflows: IAgentMessage['workflows'] = {}
      const agentThoughts: IAgentThought[] = []

      for await (const chunk of XStream({
        readableStream: response.body as NonNullable<ReadableStream>,
      })) {
        if (chunk.data) {
          console.log('chunk.data', chunk.data);
          let parsedData = {} as {
            id: string
            task_id: string
            position: number
            tool: string
            tool_input: string
            observation: string
            message_files: string[]

            event: string;
            answer: string;
            conversation_id: string;
            message_id: string;

            // 类型
            type: 'image'
            // 图片链接
            url: string

            data: {
              // 工作流节点的数据
              id: string;
              node_type: IWorkflowNode['type'];
              title: string;
              inputs: string;
              outputs: string;
              process_data: string;
              elapsed_time: number;
              execution_metadata: IWorkflowNode['execution_metadata']
            };
          };
          try {
            parsedData = JSON.parse(chunk.data);
          } catch (error) {
            console.error('解析 JSON 失败', error);
          }
          if (parsedData.event === 'message_end') {
            onSuccess({
              content: result,
              files,
              workflows,
              agentThoughts
            });
            // 如果开启了建议问题，获取下一轮问题建议
            if (appParameters?.suggested_questions_after_answer.enabled) {
              getNextSuggestions(parsedData.message_id);
            }
          }
          const innerData = parsedData.data
          if (parsedData.event === 'workflow_started') {
            workflows.status = 'running'
            workflows.nodes = []
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts
            })
          } else if (parsedData.event === 'workflow_finished') {
            console.log('工作流结束', parsedData)
            workflows.status = 'finished'
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts
            })
          } else if (parsedData.event === 'node_started') {
            console.log('节点开始', parsedData)
            workflows.nodes = [
              ...(workflows.nodes || []),
              {
                id: innerData.id,
                status: 'running',
                type: innerData.node_type,
                title: innerData.title,
              } as IWorkflowNode
            ]
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts
            })
          } else if (parsedData.event === 'node_finished') {
            workflows.nodes = workflows.nodes?.map((item) => {
              if (item.id === innerData.id) {
                return {
                  ...item,
                  status: 'success',
                  inputs: innerData.inputs,
                  outputs: innerData.outputs,
                  process_data: innerData.process_data,
                  elapsed_time: innerData.elapsed_time,
                  execution_metadata: innerData.execution_metadata
                };
              }
              return item
            })
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts
            })
          }
          if (parsedData.event === 'message_file') {
            result += `<img src=""${parsedData.url} />`
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts,
            })
          }
          if (parsedData.event === 'message' || parsedData.event === 'agent_message') {
            const text = parsedData.answer;
            const conversation_id = parsedData.conversation_id;

            // 如果有对话 ID，跟当前的对比一下
            if (conversation_id) {
              // 通知外部组件，对话 ID 变更，外部组件需要更新对话列表
              onConversationIdChange(conversation_id);
            }
            result += text;
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts,
            });
          }
          if (parsedData.event === 'error') {
            onError({
              name: `${parsedData.status}: ${parsedData.code}`,
              message: parsedData.message
            });
          }
          if (parsedData.event === 'agent_thought') {
            agentThoughts.push({
              conversation_id: parsedData.conversation_id,
              id: parsedData.id,
              task_id: parsedData.task_id,
              position: parsedData.position,
              tool: parsedData.tool,
              tool_input: parsedData.tool_input,
              observation: parsedData.observation,
              message_files: parsedData.message_files,
              message_id: parsedData.message_id
            })
            onUpdate({
              content: result,
              files,
              workflows,
              agentThoughts
            })
          }
        } else {
          console.log('没有数据', chunk);
          // continue;
        }
      }
    },
  });

  /**
   * 获取对话的历史消息
   */
  const getConversationMessages = async (conversationId: string) => {
    // 如果是临时 ID，则不获取历史消息
    if (isTempId(conversationId)) {
      return;
    }
    const result = await difyApi.getConversationHistory(conversationId);
    console.log('对话历史', result);

    const newMessages: MessageInfo<IAgentMessage>[] = [];

    if (result.data.length) {
      setTarget(result.data[0]?.inputs?.target);
    }

    const difyVersion = DIFY_INFO.version
    let baseData = result.data
    // Dify 1.0 以上版本的消息列表是按从新到旧的顺序返回的，需要倒序一下
    if (gte(difyVersion, '1.0.0')) {
      baseData = baseData.reverse()
    }
    baseData.forEach((item) => {
      newMessages.push(
        {
          id: `${item.id}-query`,
          message: {
            content: item.query,
          },
          status: 'success',
          isHistory: true,
          message_files: item.message_files,
        },
        {
          id: `${item.id}-answer`,
          message: {
            content: item.answer,
          },
          status: item.status,
          error: item.error,
          isHistory: true,
          feedback: item.feedback,
          agentThoughts: item.agent_thoughts || [],
        },
      );
    })

    setHistoryMessages(newMessages);
  };

  const { onRequest, messages, setMessages } = useXChat({
    agent,
  });

  // console.log('messages in render', JSON.stringify(messages));
  console.log('historyMessages in render', JSON.stringify(historyMessages));

  const initConversationInfo = async () => {
    // 有对话 ID 且非临时 ID 时，获取历史消息
    if (conversationId && !isTempId(conversationId)) {
      await getConversationMessages(conversationId);
      setInitLoading(false);
    } else {
      // 判断是否有参数 有参数则展示表单
      if (appParameters?.user_input_form?.length) {
        setFormVisible(true);
        // 有参数则展示表单
        const formItems =
          appParameters.user_input_form?.map((item) => {
            if (item['text-input']) {
              const originalProps = item['text-input'];
              const baseProps: IConversationEntryFormItem = {
                type: 'input',
                label: originalProps.label,
                name: originalProps.variable,
              };
              if (originalProps.required) {
                baseProps.required = true;
                baseProps.rules = [{ required: true, message: '请输入' }];
              }
              return baseProps;
            }
            return {} as IConversationEntryFormItem;
          }) || [];
        setUserInputItems(formItems);
      }
      // 不管有没有参数，都结束 loading，开始展示内容
      setInitLoading(false);
    }
  };

  useEffect(() => {
    setInitLoading(true);
    setFormVisible(false);
    setMessages([]);
    setHistoryMessages([]);
    initConversationInfo();
  }, [conversationId]);

  const onPromptsItemClick: GetProp<typeof Prompts, 'onItemClick'> = (info) => {
    onRequest({
      content: info.data.description as string
    });
  };

  const onSubmit = (nextContent: string, files?: IFile[]) => {
    filesRef.current = files || [];
    onRequest({
      content: nextContent
    });
  };

  const items: GetProp<typeof Bubble.List, 'items'> = [...historyMessages, ...messages].map((messageItem) => {
    const { id, message, status } = messageItem;
    const isQuery = id.toString().endsWith('query');
    const agentThoughts: IAgentThought[] = messageItem.isHistory ? messageItem.agentThoughts : message.agentThoughts
    return {
      key: id,
      // 不要开启 loading 和 typing, 否则流式会无效
      // loading: status === 'loading',
      content: message.content,
      messageRender: (content: string) => {
        if (messageItem.status === 'error') {
          return (
            <div className="text-red-700">
              <WarningOutlined className="mr-2" />
              <span>{messageItem.error}</span>
            </div>
          );
        }

        return (
          <>
            {/* 思维链 */}
            <ThoughtChain uniqueKey={messageItem.id as string} items={agentThoughts} />

            {/* 工作流执行日志 */}
            <WorkflowLogs items={message.workflows?.nodes || []} status={message.workflows?.status} />

            {/* 用户发送的图片列表 */}
            <>
              {message.files?.length
                ? message.files.map((item: IMessageFileItem) => {
                  return (
                    <img
                      src={item.url}
                      key={item.id}
                      alt={item.filename}
                      className="max-w-full"
                    />
                  );
                })
                : null}
            </>

            {/* 文本内容 */}
            <MdRender markdownText={content} />
          </>
        );
      },
      // 用户发送消息时，status 为 local，需要展示为用户头像
      role: isQuery || status === 'local' ? 'user' : 'ai',
      footer: isQuery ? null : (
        <MessageFooter
          difyApi={difyApi}
          messageId={id as string}
          messageContent={message.content}
          feedback={{
            rating: messageItem.feedback?.rating,
            callback: () => getConversationMessages(conversationId!),
          }}
        />
      ),
    };
  }) as GetProp<typeof Bubble.List, 'items'>

  return (
    <div className="flex h-screen flex-col overflow-hidden flex-1">
      {conversationName ? (
        <div className="h-16 leading-[4rem] px-8 text-gray-800 text-base top-0 z-20 mr-4 bg-white w-full shadow-sm">
          {conversationName}
        </div>
      ) : null}

      <div className="flex-1 overflow-hidden">
        {/* 有对话信息时，优先展示 */}
        {initLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Spin spinning />
          </div>
        ) : formVisible ? (
          <div className="w-full h-full flex items-center justify-center -mt-5">
            <div className="w-96">
              <div className="text-2xl font-bold text-black mb-5">
                {appInfo?.name}
              </div>
              <Form form={entryForm}>
                {userInputItems.map((item) => {
                  return (
                    <Form.Item
                      key={item.name}
                      name={item.name}
                      label={item.label}
                      required={item.required}
                      rules={item.rules}
                    >
                      {item.type === 'input' ? (
                        <Input placeholder="请输入" />
                      ) : item.type === 'select' ? (
                        <Select placeholder="请选择" />
                      ) : (
                        '不支持的控件类型'
                      )}
                    </Form.Item>
                  );
                })}
              </Form>
              <Button
                block
                type="primary"
                icon={<MessageOutlined />}
                onClick={async () => {
                  setTarget(entryForm.getFieldValue('target'));
                  setFormVisible(false);
                }}
              >
                开始对话
              </Button>
            </div>
          </div>
        ) : conversationId ? (
          <Chatbox
            nextSuggestions={nextSuggestions}
            items={items}
            isRequesting={agent.isRequesting()}
            onPromptsItemClick={onPromptsItemClick}
            onSubmit={onSubmit}
            difyApi={difyApi}
          />
        ) : appInfo ? (
          <AppInfo info={appInfo} />
        ) : null}
      </div>
    </div>
  );
}
