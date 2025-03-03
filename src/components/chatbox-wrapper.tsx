import {
  CopyOutlined,
  DislikeOutlined,
  LikeOutlined,
  MessageOutlined,
  RobotOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  FormItemProps,
  GetProp,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  message as antdMessage,
	theme,
} from 'antd';
import { Chatbox } from './chatbox';
import {
  DifyApi,
  IFile,
  IGetAppInfoResponse,
  IGetAppParametersResponse,
} from '../utils/dify-api';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bubble,
  BubbleProps,
  Prompts,
  useXAgent,
  useXChat,
  XStream,
} from '@ant-design/x';
import { RESPONSE_MODE, USER } from '../config';
import { MessageInfo } from '@ant-design/x/es/use-x-chat';
import MarkdownIt from 'markdown-it';
import { isTempId } from '../utils/utils';
import { copyToClipboard } from '@toolkit-fe/clipboard'
import { DIFY_INFO } from '../utils/vars';
import { gte } from 'semver'

/**
 * 消息对象中的文件 item
 */
interface IMessageFileItem {
  id: string;
  filename: string;
  type: string;
  url: string;
  mime_type: string;
  size: number;
  transfer_method: string;
  belongs_to: string;
}

interface IConversationEntryFormItem extends FormItemProps {
  type: 'input' | 'select';
}

const md = MarkdownIt({ html: true, breaks: true });

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
	const { token } = theme.useToken()

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
  const [historyMessages, setHistoryMessages] = useState<MessageInfo<string>[]>(
    [],
  );
  const [userInputItems, setUserInputItems] = useState<
    IConversationEntryFormItem[]
  >([]);
  const [formVisible, setFormVisible] = useState<boolean>(false);

  const [nextSuggestions, setNextSuggestions] = useState<string[]>([]);
	// 定义 ref, 用于获取最新的 conversationId
	const conversationIdRef = useRef<string>();
  const difyApiRef = useRef<DifyApi>(difyApi);
  useEffect(() => {
    conversationIdRef.current = conversationId; // 实时更新 ref
    difyApiRef.current = difyApi; // 实时更新 ref
  }, [conversationId]);
  const filesRef = useRef<IFile[]>([]);

  /**
   * 获取下一轮问题建议
   */
  const getNextSuggestions = async (message_id: string) => {
    const result = await difyApi.getNextSuggestions({ message_id });
    setNextSuggestions(result.data);
  };

  const [agent] = useXAgent({
    request: async ({ message }, { onSuccess, onUpdate }) => {

      // 发送消息
      const response = await difyApiRef.current.sendMessage({
        inputs: {
          target,
        },
        conversation_id: !isTempId(conversationIdRef.current)
          ? conversationIdRef.current
          : undefined,
        files: filesRef.current || [],
        user: USER,
        response_mode: RESPONSE_MODE,
        query: message!,
      });

      let result = '';

      for await (const chunk of XStream({
        readableStream: response.body as NonNullable<ReadableStream>,
      })) {
        if (chunk.data) {
          console.log('chunk.data', chunk.data);
          let parsedData = {} as {
            event: string;
            answer: string;
            conversation_id: string;
            message_id: string;
          };
          try {
            parsedData = JSON.parse(chunk.data);
          } catch (error) {
            console.error('解析 JSON 失败', error);
          }
          if (parsedData.event === 'message_end') {
            onSuccess(result);
						// 如果开启了建议问题，获取下一轮问题建议
						if (appParameters?.suggested_questions_after_answer.enabled) {
							getNextSuggestions(parsedData.message_id);
						}
          }
          if (!parsedData.answer) {
            console.log('没有数据', chunk);
          } else {
            const text = parsedData.answer;
            const conversation_id = parsedData.conversation_id;

            // 如果有对话 ID，跟当前的对比一下
            if (conversation_id) {
              // 通知外部组件，对话 ID 变更，外部组件需要更新对话列表
              onConversationIdChange(conversation_id);
            }
            result += text;
            onUpdate(result);
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

    const newMessages: MessageInfo<string>[] = [];

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
          message: item.query,
          status: 'success',
          isHistory: true,
          message_files: item.message_files,
        },
        {
          id: `${item.id}-answer`,
          message: item.answer,
          status: 'success',
          isHistory: true,
          feedback: item.feedback,
        },
      )
    })

    setHistoryMessages(newMessages);
  };

  const { onRequest, messages, setMessages } = useXChat({
    agent,
  });

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
    onRequest(info.data.description as string);
  };

  const onSubmit = (nextContent: string, files?: IFile[]) => {
    filesRef.current = files || [];
    onRequest(nextContent);
  };

  const renderMarkdown: BubbleProps['messageRender'] = (content) => (
    <Typography>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );

  const items: GetProp<typeof Bubble.List, 'items'> = useMemo(() => {
    console.log('message变更', [...historyMessages, ...messages]);
    return [...historyMessages, ...messages].map((messageItem) => {
      const { id, message, status, message_files } = messageItem;
      const isQuery = id.toString().endsWith('query');
			const isLiked = messageItem.feedback?.rating === 'like';
			const isDisLiked = messageItem.feedback?.rating === 'dislike';
      return {
        key: id,
        // 不要开启 loading 和 typing, 否则流式会无效
        // loading: status === 'loading',
        content: message,
        messageRender: (content: string) => {
          return <>
          {/* 用户发送的图片列表 */}
          <>
          {
            message_files?.length ?
            message_files.map((item: IMessageFileItem)=>{
              return (
                <img src={item.url} key={item.id} alt={item.filename} className='max-w-full' />
              )
            })
            : null
          }
          </>
          {renderMarkdown(content)}
          </>
        },
        // 用户发送消息时，status 为 local，需要展示为用户头像
        role: isQuery || status === 'local' ? 'user' : 'ai',
        footer: isQuery ? null : (
          <Space>
            <Button
              color="default"
              variant="text"
              size="small"
              icon={<SyncOutlined />}
            />
            <Button
              color="default"
              variant="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={async() => {
								await copyToClipboard(message);
								antdMessage.success('复制成功')
							}}
            />
            <Button
              color="default"
              variant="text"
              size="small"
              icon={<LikeOutlined className={isLiked ? 'text-blue-700' : ''} />}
              onClick={async () => {
                await difyApi.feedbackMessage({
                  messageId: (id as string).replace('-answer', ''),
                  rating: isLiked ? null : 'like',
                  content: '',
                });
                antdMessage.success('操作成功');
                getConversationMessages(conversationId!);
              }}
            />
            <Button
              color="default"
              variant="text"
              size="small"
              icon={
                <DislikeOutlined
                  className={isDisLiked ? 'text-blue-700' : ''}
                />
              }
              onClick={async () => {
                await difyApi.feedbackMessage({
                  messageId: (id as string).replace('-answer', ''),
                  rating: isDisLiked ? null : 'dislike',
                  content: '',
                });
                antdMessage.success('操作成功');
                getConversationMessages(conversationId!);
              }}
            />
          </Space>
        ),
      };
    }) as GetProp<typeof Bubble.List, 'items'>;
  }, [historyMessages, messages]);

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
                  const result = await entryForm.validateFields();
                  const values = entryForm.getFieldsValue();
                  console.log('表单值', values);
                  console.log('result', result);
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
          <div className="w-full h-full flex items-center justify-center text-black">
            <div className="flex items-center justify-center flex-col">
              <RobotOutlined
                className='text-2xl'
                style={{
                  color: token.colorPrimary,
                }}
              />
              <div className="text-2xl font-bold mt-3">{appInfo.name}</div>
              <div className="text-gray-700 text-base max-w-44 mt-3">
                {appInfo.description}
              </div>
              {appInfo.tags ? (
                <div>
                  {appInfo.tags.map((tag) => {
                    return <Tag key={tag}>{tag}</Tag>;
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
