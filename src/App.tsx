import { XProvider } from '@ant-design/x';
import { createStyles } from 'antd-style';
import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Spin } from 'antd';
import {
  DifyApi,
  IDifyApiOptions,
  IGetAppInfoResponse,
  IGetAppParametersResponse,
  useDifyApi,
} from '@dify-chat/api';
import { USER } from './config';
import ChatboxWrapper from './components/chatbox-wrapper';
import { Logo } from './components/logo';
import { type IConversationItem } from '@dify-chat/components';
import { useMap4Arr } from './hooks/use-map-4-arr';
import { UnauthorizedError } from '@dify-chat/api';
import { IDifyAppItem, LocalStorageConfigStorage } from '@dify-chat/helpers';
import AppList from './components/app-list';
import { DEFAULT_CONVERSATION_NAME } from './constants';

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
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

const appStore = new LocalStorageConfigStorage();

const App: React.FC = () => {
  const [difyApiOptions, setDifyApiOptions] = useState<IDifyApiOptions>();
  // 创建 Dify API 实例
  const { instance: difyApi, isInstanceReady } = useDifyApi(difyApiOptions);
  const { styles } = useStyle();
  const [appList, setAppList] = useState<IDifyAppItem[]>([]);
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

  const [selectedAppId, setSelectedAppId] = useState<string>(
    appList[0]?.id || '',
  );
  const [appListLoading, setAppListLoading] = useState<boolean>(false);

  /**
   * 获取应用列表
   */
  const getAppList = async () => {
    setAppListLoading(true);
    try {
      const result = await appStore.getApps();
      console.log('应用列表', result);
      setAppList(result || []);
      if (!selectedAppId && result.length) {
        setSelectedAppId(result[0]?.id || '');
      }
    } catch (error) {
      message.error(`获取应用列表失败: ${error}`);
      console.error(error);
    } finally {
      setAppListLoading(false);
    }
  };

  // 初始化获取应用列表
  useEffect(() => {
    getAppList();
  }, []);

  useEffect(() => {
    const appItem = appList.find((item) => item.id === selectedAppId);
    if (!appItem) {
      return;
    }
    setDifyApiOptions({
      user: USER,
      ...appItem.requestConfig,
    });
  }, [selectedAppId]);

  const initAppInfo = async () => {
    setAppInfo(undefined)
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

  useEffect(() => {
    initAppInfo().then(() => {
      getConversationItems();
    });
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
      setCurrentConversationId(newItems[0]?.key);
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
    setConversationsItems((prev) => {
      return [
        {
          key: newKey,
          label: `新对话`,
        },
        ...prev,
      ];
    });
    setCurrentConversationId(newKey);
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

  const [settingForm] = Form.useForm();
  const openSettingModal = async (
    updatingItem?: IDifyAppItem,
  ): Promise<void> => {
    settingForm.resetFields();
    if (updatingItem) {
      settingForm.setFieldsValue({
        apiBase: updatingItem.requestConfig.apiBase,
        apiKey: updatingItem.requestConfig.apiKey,
      });
    }
    return new Promise((resolve) => {
      Modal.confirm({
        width: 600,
        centered: true,
        title: `${updatingItem ? '更新' : '添加'} Dify 应用配置`,
        content: (
          <Form
            form={settingForm}
            labelAlign="left"
            className="mt-4"
            labelCol={{
              span: 5,
            }}
          >
            <Form.Item
              label="API Base"
              name="apiBase"
              rules={[{ required: true }]}
              tooltip="Dify API 的域名+版本号前缀，如 https://api.dify.ai/v1"
              required
            >
              <Input placeholder="请输入 API BASE" />
            </Form.Item>
            <Form.Item
              label="API Key"
              name="apiKey"
              tooltip="Dify App 的 API Key (以 app- 开头)"
              rules={[{ required: true }]}
              required
            >
              <Input placeholder="请输入 API Key" />
            </Form.Item>
          </Form>
        ),
        onOk: async () => {
          await settingForm.validateFields();
          const values = settingForm.getFieldsValue();

          // 获取 Dify 应用信息
          const newDifyApiInstance = new DifyApi({
            user: USER,
            apiBase: values.apiBase,
            apiKey: values.apiKey,
          });
          const difyAppInfo = await newDifyApiInstance.getAppInfo();
          if (updatingItem) {
            await appStore.updateApp({
              ...updatingItem,
              requestConfig: {
                apiBase: values.apiBase,
                apiKey: values.apiKey,
              },
            })
          } else {
            await appStore.addApp({
              id: Math.random().toString(),
              info: difyAppInfo,
              requestConfig: {
                apiBase: values.apiBase,
                apiKey: values.apiKey,
              },
            });
          }
          getAppList();
          resolve();
        },
      });
    });
  };

  const conversationName = useMemo(() => {
    return (
      conversationsItems.find((item) => item.key === currentConversationId)
        ?.label || DEFAULT_CONVERSATION_NAME
    );
  }, [conversationsItems, currentConversationId]);

  return (
    <XProvider
      theme={{ token: { colorPrimary: '#1689fe', colorText: '#333' } }}
    >
      <div className={styles.layout}>
        {/* 左侧边栏 - 小屏幕隐藏 */}
        <div className={`${styles.menu} hidden md:!flex w-72 h-full flex-col`}>
          {/* 🌟 Logo */}
          <Logo openSettingModal={openSettingModal} />
          {/* 添加应用 */}
          <Button
            onClick={() => openSettingModal()}
            className="h-10 leading-10 border border-solid border-gray-200 w-[calc(100%-24px)] mt-0 mx-3 text-default hover:text-[#1689fe]"
            icon={<PlusOutlined />}
          >
            添加 Dify 应用
          </Button>
          {/* 🌟 会话管理 */}
          <div className="px-3 flex-1 overflow-y-auto">
            <Spin spinning={appListLoading}>
              <AppList
                selectedId={selectedAppId}
                onSelectedChange={(id) => {
                  setSelectedAppId(id);
                }}
                list={appList}
                onUpdate={async (id: string, item) => {
                  const currentItem = appList.find((item) => item.id === id);
                  if (!currentItem) {
                    message.error('应用不存在');
                    return;
                  }
                  return openSettingModal(item);
                }}
                onDelete={async (id: string) => {
                  await appStore.deleteApp(id);
                  getAppList();
                }}
              />
            </Spin>
          </div>
        </div>

        {/* 右侧聊天窗口 - 移动端全屏 */}
        <div className="flex-1 min-w-0">
          {' '}
          {/* 新增外层容器 */}
          <ChatboxWrapper
            appInfo={appInfo}
            difyApi={difyApi!}
            conversationId={currentConversationId}
            conversationName={conversationName}
            conversationItems={conversationsItems}
            onConversationIdChange={setCurrentConversationId}
            appParameters={appParameters}
            onAddConversation={onAddConversation}
            onItemsChange={setConversationsItems}
            conversationItemsChangeCallback={getConversationItems}
          />
        </div>
      </div>
    </XProvider>
  );
};

export default App;
