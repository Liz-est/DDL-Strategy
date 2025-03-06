import { CheckCircleFilled } from "@ant-design/icons";
import { ThoughtChain as XThoughtChain, ThoughtChainItem } from "@ant-design/x"
import { Collapse } from "antd";
import { IAgentThought } from "../../types";
import CollapseItem from "./collapse-item";

interface IThoughtChainProps {
  /**
   * 思维链的唯一 Key
   */
  uniqueKey: string
  /**
   * 原始思维链数据
   */
  items: IAgentThought[]
}

/**
 * 思维链组件（处理 Dify 原始思维链数据到 Ant Design X 思维链数据的转换）
 */
export default function ThoughtChain(props: IThoughtChainProps) {

  const { uniqueKey, items } = props

  if (!items?.length) {
    return null
  }

  const thoughtChainItems = items.map((item) => {
    return {
      title: <div className="text-base">{item.tool ? `已使用 ${item.tool}` : '暂无标题'}</div>,
      status: 'success',
      icon: <CheckCircleFilled />,
      description: (
        <Collapse
          className='mt-3 min-w-chat-card'
          size="small"
          items={[
            {
              key: `${uniqueKey}-tool_input`,
              label: '输入',
              children: <CollapseItem text={item.tool_input} />,
            },
            {
              key: `${uniqueKey}-observation`,
              label: '输出',
              children: <CollapseItem text={item.observation} />,
            },
          ]}
        />
      ),
    };
  }) as ThoughtChainItem[];

  if (!thoughtChainItems?.length) {
    return null
  }

  return (
    <XThoughtChain
      items={thoughtChainItems}
    />
  )
}