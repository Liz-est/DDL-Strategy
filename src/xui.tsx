import { Conversations, XProvider } from '@ant-design/x';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import './App.css';

import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Spin, type GetProp } from 'antd';
import {
  IGetAppInfoResponse,
  IGetAppParametersResponse,
  useDifyApi,
} from './utils/dify-api';
import { USER } from './config';
import ChatboxWrapper from './components/chatbox-wrapper';
import { Logo } from './components/logo';
import ConversationList, { IConversationItem } from './components/conversation-list';

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;

      .ant-prompts {
        color: ${token.colorText};
      }
    `,
    menu: css`
      background: ${token.colorBgLayout}80;
    `,
  };
});

const difyApiOptions = { user: USER };

const XUI: React.FC = () => {
  // 创建 Dify API 实例
  const {
    instance: difyApi,
    updateInstance,
    isInstanceReady,
  } = useDifyApi(difyApiOptions);
  const { styles } = useStyle();
  const [conversationsItems, setConversationsItems] = useState<
    IConversationItem[]
  >([]);
  // 优化会话列表查找逻辑（高频操作）
  const [conversationMap] = useState<Map<string, IConversationItem>>(new Map());
  const [conversationListLoading, setCoversationListLoading] =
    useState<boolean>(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [appInfo, setAppInfo] = useState<IGetAppInfoResponse>();
  const [appParameters, setAppParameters] =
    useState<IGetAppParametersResponse>();

  useEffect(() => {
    const newMap = new Map(conversationsItems.map(item => [item.key, item]));
    conversationMap.clear();
    newMap.forEach((v, k) => conversationMap.set(k, v));
  }, [conversationsItems]);

  const initAppInfo = async () => {
    if (!difyApi) {
      return;
    }
    // 获取应用信息
    const [baseInfo, _meta, appParameters] = await Promise.all([
      difyApi.getAppInfo(),
      difyApi.getAppMeta(),
      difyApi.getAppParameters(),
    ]);
    setAppInfo({
      ...baseInfo,
    });
    setAppParameters(appParameters);
  };

  useEffect(() => {
    initAppInfo();
    getConversationItems();
    setCurrentConversationId(undefined);
  }, [difyApi]);

  const getConversationItems = async () => {
    setCoversationListLoading(true);
    try {
      const result = await difyApi?.getConversationList();
      const newItems =
        result?.data?.map((item) => {
          return {
            key: item.id,
            label: item.name,
          };
        }) || [];
      setConversationsItems(newItems);
    } catch (error) {
      console.error(error);
      message.error(`获取会话列表失败: ${error}`);
    } finally {
      setCoversationListLoading(false);
    }
  };

  useEffect(() => {
    if (!isInstanceReady || !difyApi) {
      return;
    }
    getConversationItems();
  }, []);

  const onAddConversation = () => {
    // 创建新对话
    const newKey = `temp_${Math.random()}`;
    // 使用函数式更新保证状态一致性（修复潜在竞态条件）
    setConversationsItems((prev)=>{
      return [
        {
          key: newKey,
          label: `新对话`,
        },
        ...prev,
      ]
    })
    setCurrentConversationId(newKey);
  };

  const handleAddConversationBtnClick = async () => {
    onAddConversation();
  };

  const onConversationClick: GetProp<typeof Conversations, 'onActiveChange'> = (
    key,
  ) => {
    setCurrentConversationId(key);
  };

  useEffect(() => {
    // 如果对话 ID 不在当前列表中，则刷新一下
    if (
      isInstanceReady &&
      currentConversationId &&
      !conversationMap.has(currentConversationId)
    ) {
      getConversationItems();
    }
  }, [currentConversationId]);

  return (
    <XProvider theme={{ token: { colorPrimary: '#1689fe' } }}>
      <div className={styles.layout}>
        {/* 左侧边栏 */}
        <div className={`${styles.menu} w-72 h-full flex flex-col`}>
          {/* 🌟 Logo */}
          <Logo
            onSettingUpdated={async () => {
              updateInstance();
            }}
          />
          {/* 🌟 添加会话 */}
          <Button
            onClick={handleAddConversationBtnClick}
            className="border border-solid border-[#1689fe] w-[calc(100%-24px)] mt-0 mx-3 text-[#1689fe]"
            icon={<PlusOutlined />}
          >
            New Conversation
          </Button>
          {/* 🌟 会话管理 */}
          <div className="py-0 px-3 flex-1 overflow-y-auto">
            <Spin spinning={conversationListLoading}>
              <ConversationList
                difyApi={difyApi!}
                items={conversationsItems}
                activeKey={currentConversationId}
                onActiveChange={onConversationClick}
                onItemsChange={setConversationsItems}
                refreshItems={getConversationItems}
              />
            </Spin>
          </div>
        </div>

        {/* 右侧聊天窗口 */}
        <ChatboxWrapper
          appInfo={appInfo}
          difyApi={difyApi!}
          conversationId={currentConversationId}
          conversationName={
            conversationMap.get(currentConversationId as string)?.label || ''
          }
          onConversationIdChange={setCurrentConversationId}
          appParameters={appParameters}
        />
      </div>
    </XProvider>
  );
};

export default XUI;
