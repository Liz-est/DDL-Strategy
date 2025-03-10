import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Conversations } from "@ant-design/x";
import { isTempId } from "../utils/utils";
import { Form, Input, message, Modal } from "antd";
import { DifyApi } from "../utils/dify-api";

export interface IConversationItem {
  key: string;
  label: string;
}

interface IConversationListProps {
  /**
   * Dify API
   */
  difyApi: DifyApi;
  /**
   * 会话列表
   */
  items: IConversationItem[]
  /**
   * 当前激活的会话 ID
   */
  activeKey?: string
  /**
   * 会话切换回调
   */
  onActiveChange?: (key: string) => void
  /**
   * 会话列表更新回调
   */
  onItemsChange?: (items: IConversationItem[]) => void
  /**
   * 刷新会话列表
   */
  refreshItems: () => void
}

export default function ConversationList(props: IConversationListProps) {

  const { difyApi, items, activeKey, onActiveChange, onItemsChange, refreshItems } = props

  const [renameForm] = Form.useForm();

  return (
    <Conversations
      className="p-0"
      items={items}
      activeKey={activeKey}
      onActiveChange={onActiveChange}
      menu={(conversation) => ({
        items: [
          {
            label: '重命名',
            key: 'rename',
            icon: <EditOutlined />,
          },
          {
            label: '删除',
            key: 'delete',
            icon: <DeleteOutlined />,
            danger: true,
          },
        ],
        onClick: async (menuInfo) => {
          menuInfo.domEvent.stopPropagation();

          switch (menuInfo.key) {
            case 'delete':
              if (isTempId(conversation.key)) {
                // 如果是临时对话，则直接删除
                onItemsChange?.(
                  items.filter(
                    (item) => item.key !== conversation.key,
                  ),
                );
                message.success('删除成功');
              } else {
                // 否则调用删除接口
                await difyApi?.deleteConversation(conversation.key);
                message.success('删除成功');
                refreshItems();
              }
              if (activeKey === conversation.key) {
                onActiveChange?.('');
              }
              break;
            case 'rename':
              renameForm.setFieldsValue({
                name: conversation.label,
              });
              Modal.confirm({
                destroyOnClose: true,
                title: '会话重命名',
                content: (
                  <Form form={renameForm} className="mt-3">
                    <Form.Item name='name'>
                      <Input placeholder='请输入' />
                    </Form.Item>
                  </Form>
                ),
                onOk: async () => {
                  await renameForm.validateFields()
                  const values = await renameForm.validateFields(); 
                  await difyApi?.renameConversation({
                    conversation_id: conversation.key,
                    name: values.name,
                  });
                  message.success('会话重命名成功');
                  refreshItems();
                }
              });
              break;
            default:
              break;
          }
        },
      })}
    />
  );
}
