import { XProvider } from '@ant-design/x';
import { createStyles } from 'antd-style';
import React, { useEffect, useMemo, useState } from 'react';
import './../App.css';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, message, Spin } from 'antd';
import {
  createDifyApiInstance,
  IGetAppInfoResponse,
  IGetAppParametersResponse,
} from '@dify-chat/api';
import ChatboxWrapper from '@/components/chatbox-wrapper';
import { Logo } from '@/components/logo';
import {
  ConversationList,
  type IConversationItem,
} from '@dify-chat/components';
import { useMap4Arr } from '@/hooks/use-map-4-arr';
import {
  IDifyChatContextSingleApp,
} from '@dify-chat/core';
import { DEFAULT_CONVERSATION_NAME } from '@/constants';
import { useDifyChat } from '@dify-chat/core';
import { colors } from '@/theme/config';
import { useMount } from 'ahooks';

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
    `,
    menu: css`
      background: ${token.colorBgLayout}80;
    `,
  };
});

const SingleAppLayout: React.FC = () => {
  const difyChatContext = useDifyChat();
  const { user } = difyChatContext;
  // 创建 Dify API 实例
  const { styles } = useStyle();
  const [difyApi] = useState(
    createDifyApiInstance({
      user,
      apiBase: '',
      apiKey: '',
    }),
  );
  const [conversationsItems, setConversationsItems] = useState<
    IConversationItem[]
  >([]);
  // 优化会话列表查找逻辑（高频操作）
  const conversationMap = useMap4Arr<IConversationItem>(
    conversationsItems,
    'key',
  );
  const [conversationListLoading, setCoversationListLoading] =
    useState<boolean>(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [appInfo, setAppInfo] = useState<IGetAppInfoResponse>();
  const [appParameters, setAppParameters] =
    useState<IGetAppParametersResponse>();

  const initInSingleMode = async () => {
    difyApi.updateOptions({
      user,
      apiBase: (difyChatContext as IDifyChatContextSingleApp).appConfig.apiBase,
      apiKey: (difyChatContext as IDifyChatContextSingleApp).appConfig.apiKey,
    });
    initAppInfo().then(() => {
      getConversationItems();
    });
    setCurrentConversationId(undefined);
  };

  // 初始化获取应用列表
  useMount(() => {
    initInSingleMode();
  });

  const initAppInfo = async () => {
    setAppInfo(undefined);
    if (!difyApi) {
      return;
    }
    // 获取应用信息
    const baseInfo = await difyApi.getAppInfo();
    setAppInfo({
      ...baseInfo,
    });
    const appParameters = await difyApi.getAppParameters();
    setAppParameters(appParameters);
  };

  /**
   * 获取对话列表
   */
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
      setCurrentConversationId(newItems[0]?.key);
    } catch (error) {
      console.error(error);
      message.error(`获取会话列表失败: ${error}`);
    } finally {
      setCoversationListLoading(false);
    }
  };

  /**
   * 添加临时新对话(要到第一次服务器响应有效的对话 ID 时才真正地创建完成)
   */
  const onAddConversation = () => {
    // 创建新对话
    const newKey = `temp_${Math.random()}`;
    // 使用函数式更新保证状态一致性（修复潜在竞态条件）
    setConversationsItems((prev) => {
      return [
        {
          key: newKey,
          label: DEFAULT_CONVERSATION_NAME,
        },
        ...prev,
      ];
    });
    setCurrentConversationId(newKey);
  };

  useEffect(() => {
    // 如果对话 ID 不在当前列表中，则刷新一下
    if (currentConversationId && !conversationMap.has(currentConversationId)) {
      getConversationItems();
    }
  }, [currentConversationId]);

  const conversationName = useMemo(() => {
    return (
      conversationsItems.find((item) => item.key === currentConversationId)
        ?.label || DEFAULT_CONVERSATION_NAME
    );
  }, [conversationsItems, currentConversationId]);

  return (
    <XProvider
      theme={{
        token: { colorPrimary: colors.primary, colorText: colors.default },
      }}
    >
      <div className={`w-full h-screen flex ${styles.layout}`}>
        {/* 左侧边栏 - 小屏幕隐藏 */}
        <div className={`${styles.menu} hidden md:!flex w-72 h-full flex-col`}>
          {/* 🌟 Logo */}
          <Logo />
          {/* 添加会话 */}
          <Button
            onClick={() => onAddConversation()}
            className="h-10 leading-10 border border-solid border-gray-200 w-[calc(100%-24px)] mt-0 mx-3 text-default"
            icon={<PlusOutlined />}
          >
            新增对话
          </Button>
          {/* 🌟 对话管理 */}
          <div className="px-3">
            <Spin spinning={conversationListLoading}>
              {conversationsItems?.length ? (
                <ConversationList
                  renameConversationPromise={(
                    conversationId: string,
                    name: string,
                  ) =>
                    difyApi?.renameConversation({
                      conversation_id: conversationId,
                      name,
                    })
                  }
                  deleteConversationPromise={difyApi?.deleteConversation}
                  items={conversationsItems}
                  activeKey={currentConversationId}
                  onActiveChange={(id) => setCurrentConversationId(id)}
                  onItemsChange={setConversationsItems}
                  refreshItems={getConversationItems}
                />
              ) : (
                <Empty className='mt-6' description="当前应用下暂无会话" />
              )}
            </Spin>
          </div>
        </div>

        {/* 右侧聊天窗口 - 移动端全屏 */}
        <div className="flex-1 min-w-0">
          {' '}
          {/* 新增外层容器 */}
          {conversationListLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Spin spinning />
            </div>
          ) : (
            <ChatboxWrapper
              appInfo={appInfo}
              difyApi={difyApi}
              conversationId={currentConversationId}
              conversationName={conversationName}
              conversationItems={conversationsItems}
              onConversationIdChange={setCurrentConversationId}
              appParameters={appParameters}
              conversationListLoading={conversationListLoading}
              onAddConversation={onAddConversation}
              onItemsChange={setConversationsItems}
              conversationItemsChangeCallback={getConversationItems}
            />
          )}
        </div>
      </div>
    </XProvider>
  );
};

export default SingleAppLayout;
