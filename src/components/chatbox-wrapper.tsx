import { MessageOutlined } from '@ant-design/icons';
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
} from '@dify-chat/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bubble, Prompts } from '@ant-design/x';
import { isTempId } from '@dify-chat/helpers';
import { useLatest } from '../hooks/use-latest';
import AppInfo from './app-info';
import MessageFooter from './message/footer';
import { isMobile } from '@toolkit-fe/where-am-i';
import { useX } from '../hooks/useX';
import MessageContent, { IMessageItem4Render } from './message/content';

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
  /**
   * 添加对话
   */
  onAddConversation: () => void;
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
    onAddConversation,
  } = props;
  const abortRef = useRef(() => { });
  useEffect(() => {
		return () => {
			abortRef.current();
		};
	}, []);
  const [initLoading, setInitLoading] = useState<boolean>(false);
  const [target, setTarget] = useState('');
  const [historyMessages, setHistoryMessages] = useState<IMessageItem4Render[]>([]);
  const [userInputItems, setUserInputItems] = useState<
    IConversationEntryFormItem[]
  >([]);
  const [formVisible, setFormVisible] = useState<boolean>(false);

  const [nextSuggestions, setNextSuggestions] = useState<string[]>([]);
  // 定义 ref, 用于获取最新的 conversationId
  const latestProps = useLatest({
    conversationId,
    difyApi,
  });

  const filesRef = useRef<IFile[]>([]);

  /**
   * 获取下一轮问题建议
   */
  const getNextSuggestions = async (message_id: string) => {
    const result = await difyApi.getNextSuggestions({ message_id });
    setNextSuggestions(result.data);
  };

  /**
   * 获取对话的历史消息
   */
  const getConversationMessages = async (conversationId: string) => {
    // 如果是临时 ID，则不获取历史消息
    if (isTempId(conversationId)) {
      return;
    }
    const result = await latestProps.current.difyApi.getConversationHistory(conversationId);

    const newMessages: IMessageItem4Render[] = [];

    if (result.data.length) {
      setTarget(result.data[0]?.inputs?.target);
    }

    // 如果不是合法版本 则默认为 1.0.0
    // const difyVersion = valid(DIFY_INFO.version) ? DIFY_INFO.version : '1.0.0';
    // const baseData = result.data;
    // Dify 1.0 以上版本的消息列表是按从新到旧的顺序返回的，需要倒序一下
    // if (gte(difyVersion, '1.0.0')) {
    //   baseData = baseData.reverse();
    // }
    result.data.forEach((item) => {
      newMessages.push(
        {
          id: item.id,
          content: item.query,
          status: 'success',
          isHistory: true,
          files: item.message_files,
          role: 'user',
        },
        {
          id: item.id,
          content: item.answer,
          status: item.status === 'error' ? 'error' : 'success',
          error: item.error || '',
          isHistory: true,
          feedback: item.feedback,
          agentThoughts: item.agent_thoughts || [],
          retrieverResources: item.retriever_resources || [],
          role: 'ai'
        },
      );
    });

    setMessages([])
    setHistoryMessages(newMessages);
  };

  const { agent, onRequest, messages, setMessages } = useX({
    latestProps,
    target,
    filesRef,
    getNextSuggestions,
    appParameters,
    abortRef,
    getConversationMessages,
    onConversationIdChange,
  })

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
      content: info.data.description as string,
    });
  };

  const onSubmit = (nextContent: string, files?: IFile[]) => {
    filesRef.current = files || [];
    onRequest({
      content: nextContent,
    });
  };

  
  const unStoredMessages4Render = useMemo(()=>{
    console.log('临时消息', messages)
    return messages.map((item)=>{
      return {
        id: item.id,
        status: item.status,
        error: item.message.error || '',
        workflows: item.message.workflows,
        agentThoughts: item.message.agentThoughts,
        retrieverResources: item.message.retrieverResources,
        files: item.message.files,
        content: item.message.content,
        role: item.status === 'local' ? 'user' : 'ai'
      } as IMessageItem4Render
    })
  }, [messages])

  const items: GetProp<typeof Bubble.List, 'items'> = [
    ...historyMessages,
    ...unStoredMessages4Render,
  ].map((messageItem) => {
    return {
      key: `${messageItem.id}-${messageItem.role}`,
      // 不要开启 loading 和 typing, 否则流式会无效
      // loading: status === 'loading',
      content: messageItem.content || ' ',
      messageRender: () => {
        return (
          <MessageContent 
            messageItem={messageItem}
          />
        )
      },
      // 用户发送消息时，status 为 local，需要展示为用户头像
      role: messageItem.role === 'local' ? 'user' : messageItem.role,
      footer: messageItem.role === 'ai' && (
        <MessageFooter
          difyApi={difyApi}
          messageId={messageItem.id}
          messageContent={messageItem.content}
          feedback={{
            rating: messageItem.feedback?.rating,
            callback: () => {
              getConversationMessages(conversationId!)
            },
          }}
        />
      ),
    };
  }) as GetProp<typeof Bubble.List, 'items'>;

  return (
    <div className="flex h-screen flex-col overflow-hidden flex-1">
      {conversationId ? (
        <div
          className={`${isMobile() ? 'h-12 leading-[3rem] px-4' : 'h-16 leading-[4rem] px-8'} text-base top-0 z-20 bg-white w-full shadow-sm font-semibold`}
        >
          {conversationName || '新对话'}
        </div>
      ) : null}

      <div className="flex-1 overflow-hidden relative">
        {initLoading ? (
          <div className="absolute w-full h-full left-0 top-0 z-50 flex items-center justify-center">
            <Spin spinning />
          </div>
        ) : null}
        {conversationId ? (
          <Chatbox
            conversationId={conversationId}
            nextSuggestions={nextSuggestions}
            items={items}
            isRequesting={agent.isRequesting()}
            onPromptsItemClick={onPromptsItemClick}
            onSubmit={onSubmit}
            difyApi={difyApi}
            onCancel={() => {
              console.log('打断输出');
              abortRef.current();
            }}
          />
        ) : formVisible ? (
          <div className="w-full h-full flex items-center justify-center -mt-5">
            <div className="w-96">
              <div className="text-2xl font-bold text-default mb-5">
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
        ) : appInfo ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <AppInfo info={appInfo} />
            <Button
              className="mt-3"
              type="primary"
              icon={<MessageOutlined />}
              onClick={onAddConversation}
            >
              开始对话
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
