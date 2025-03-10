import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Conversations } from "@ant-design/x";
import { isTempId } from "@dify-chat/helpers";
import { Form, Input, message, Modal } from "antd";

/**
 * 会话列表项
 */
export interface IConversationItem {
  /**
   * 会话 ID
   */
  key: string;
  /**
   * 会话标题
   */
  label: string;
}

interface IConversationListProps {
  /**
   * 删除会话异步函数
   */
  deleteConversationPromise: (conversationId: string) => Promise<void>;
  /**
   * 重命名会话异步函数
   */
  renameConversationPromise: (conversationId: string, name: string) => Promise<void>
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

/**
 * 会话列表
 */
export const ConversationList = (props: IConversationListProps) => {

  const { deleteConversationPromise, renameConversationPromise, items, activeKey, onActiveChange, onItemsChange, refreshItems } = props

  const [renameForm] = Form.useForm();

  /**
   * 删除会话
   * @param conversationId 会话 ID
   */
  const deleteConversation = async (conversationId: string) => {
    if (isTempId(conversationId)) {
      // 如果是临时对话，则直接删除
      onItemsChange?.(
        items.filter(
          (item) => item.key !== conversationId,
        ),
      );
    } else {
      // 否则调用删除接口
      await deleteConversationPromise(conversationId);
      refreshItems();
    }
    message.success('删除成功');
    if (activeKey === conversationId) {
      onActiveChange?.('');
    }
  };

  /**
   * 重命名会话
   * @param conversation 会话对象
   */
  const renameConversation = (conversation: IConversationItem) => {
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
        await renameConversationPromise(conversation.key, values.name);
        message.success('会话重命名成功');
        refreshItems();
      }
    })
  }

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
          // 阻止冒泡 防止点击更多按钮时触发 onActiveChange
          menuInfo.domEvent.stopPropagation();
          switch (menuInfo.key) {
            case 'delete':
              await deleteConversation(conversation.key);
              break;
            case 'rename':
              renameConversation(conversation as IConversationItem);
              break;
            default:
              break;
          }
        },
      })}
    />
  );
};