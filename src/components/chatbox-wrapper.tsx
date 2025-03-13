import {
  GetProp,
  message,
  Spin,
} from 'antd';
import {
  DifyApi,
  IFile,
  IGetAppInfoResponse,
  IGetAppParametersResponse,
} from '@dify-chat/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Prompts } from '@ant-design/x';
import { isTempId } from '@dify-chat/helpers';
import { useLatest } from '../hooks/use-latest';
import { isMobile } from '@toolkit-fe/where-am-i';
import { useX } from '../hooks/useX';
import { IMessageItem4Render } from '@dify-chat/api';
import { ChatPlaceholder } from './chat-placeholder';
import { Chatbox } from '@dify-chat/components';

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
  const {
    appInfo,
    appParameters,
    difyApi,
    conversationId,
    conversationName,
    onConversationIdChange,
    onAddConversation,
  } = props;
  const abortRef = useRef(() => {});
  useEffect(() => {
    return () => {
      abortRef.current();
    };
  }, []);
  const [initLoading, setInitLoading] = useState<boolean>(false);
  const [historyMessages, setHistoryMessages] = useState<IMessageItem4Render[]>(
    [],
  );
  const [inputParams, setInputParams] = useState<{ [key: string]: unknown }>({});

  const [nextSuggestions, setNextSuggestions] = useState<string[]>([]);
  // 定义 ref, 用于获取最新的 conversationId
  const latestProps = useLatest({
    conversationId,
    difyApi,
  });
  const latestState = useLatest({
    inputParams
  })

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
    const result =
      await latestProps.current.difyApi.getConversationHistory(conversationId);

    const newMessages: IMessageItem4Render[] = [];

    // 只有当历史消息中的参数不为空时才更新
    if (result.data.length && Object.values(result.data[0]?.inputs)?.length) {
      setInputParams(result.data[0]?.inputs || {});
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
          role: 'ai',
        },
      );
    });

    setMessages([]);
    setHistoryMessages(newMessages);
  };

  const { agent, onRequest, messages, setMessages } = useX({
    latestProps,
    latestState,
    filesRef,
    getNextSuggestions,
    appParameters,
    abortRef,
    getConversationMessages,
    onConversationIdChange,
  });

  const initConversationInfo = async () => {
    // 有对话 ID 且非临时 ID 时，获取历史消息
    if (conversationId && !isTempId(conversationId)) {
      await getConversationMessages(conversationId);
      setInitLoading(false);
    } else {
      // 不管有没有参数，都结束 loading，开始展示内容
      setInitLoading(false);
    }
  };

  useEffect(() => {
    setInitLoading(true);
    setMessages([]);
    setHistoryMessages([]);
    initConversationInfo();
  }, [conversationId]);

  const onPromptsItemClick: GetProp<typeof Prompts, 'onItemClick'> = (info) => {
    onRequest({
      content: info.data.description as string,
    });
  };

  const isFormFilled = useMemo(()=>{
    return appParameters?.user_input_form.every((item) => {
      const field = item['text-input']
      return !!inputParams[field.variable] || !field.required;
    }) || false
  }, [appParameters, inputParams])

  const onSubmit = (nextContent: string, files?: IFile[]) => {

    // 先校验表单是否填写完毕
    if (!isFormFilled) {
      // 过滤出没有填写的字段
      const unFilledFields = appParameters?.user_input_form.filter((item) => {
        const field = item['text-input']
        return !inputParams[field.variable] && field.required
      }).map((item)=>item['text-input'].label) || [];
      message.error(`${unFilledFields.join('、')}不能为空`)
      return
    }

    filesRef.current = files || [];
    onRequest({
      content: nextContent,
    });
  };

  const unStoredMessages4Render = useMemo(() => {
    return messages.map((item) => {
      return {
        id: item.id,
        status: item.status,
        error: item.message.error || '',
        workflows: item.message.workflows,
        agentThoughts: item.message.agentThoughts,
        retrieverResources: item.message.retrieverResources,
        files: item.message.files,
        content: item.message.content,
        role: item.status === 'local' ? 'user' : 'ai',
      } as IMessageItem4Render;
    });
  }, [messages]);

  const chatReady = useMemo(()=>{
    if (!appParameters?.user_input_form?.length) {
      return true
    }
    if (isFormFilled) {
      return true
    }
    return false
  }, [appParameters, isFormFilled])

  return (
    <div className="flex h-screen flex-col overflow-hidden flex-1">
      {conversationId ? (
        <div
          className={`${isMobile() ? 'h-12 leading-[3rem] px-4' : 'h-16 !leading-[4rem] px-8'} text-base top-0 z-20 bg-white w-full shadow-sm font-semibold`}
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

        {chatReady && conversationId ? (
          <Chatbox
            conversationId={conversationId}
            nextSuggestions={nextSuggestions}
            messageItems={[
              ...historyMessages,
              ...unStoredMessages4Render,
            ]}
            isRequesting={agent.isRequesting()}
            onPromptsItemClick={onPromptsItemClick}
            onSubmit={onSubmit}
            onCancel={() => {
              console.log('打断输出');
              abortRef.current();
            }}
            feedbackApi={latestProps.current.difyApi.feedbackMessage}
            feedbackCallback={(conversationId: string) => {
              // 反馈成功后，重新获取历史消息
              getConversationMessages(conversationId);
            }}
            uploadFileApi={latestProps.current.difyApi.uploadFile}
            difyApi={difyApi}
          />
        ) : (
          <ChatPlaceholder
            formFilled={isFormFilled}
            onStartConversation={(formValues) => {
              setInputParams(formValues);
              if (!conversationId) {
                onAddConversation()
              }
            }}
            appInfo={appInfo}
            user_input_form={appParameters?.user_input_form}
          />
        )}
      </div>
    </div>
  );
}
