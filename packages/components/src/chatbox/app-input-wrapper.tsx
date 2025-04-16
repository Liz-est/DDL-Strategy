import {
  CaretRightOutlined,
} from '@ant-design/icons'
import { Collapse, CollapseProps, theme } from 'antd'
import { CSSProperties } from 'react'
import AppInputForm, { IAppInputFormProps } from './app-input-form'

/**
 * 应用输入参数管理容器
 */
export default function AppInputWrapper(props: IAppInputFormProps) {
  const { token } = theme.useToken();

  if (!props.user_input_form?.length) {
    return null
  }

  const getItems: (panelStyle: CSSProperties) => CollapseProps['items'] = (panelStyle) => [
    {
      key: '1',
      label: <div>对话参数设置</div>,
      children: <AppInputForm
        formFilled={props.formFilled}
        onStartConversation={props.onStartConversation}
        user_input_form={props.user_input_form}
        conversationId={props.conversationId}
        entryForm={props.entryForm}
      />,
      style: panelStyle,
    },
  ];

  const panelStyle: React.CSSProperties = {
    marginBottom: 24,
    background: token.colorWhite,
    color: token.colorText,
    borderRadius: token.borderRadiusLG,
    border: `2px solid #1669ee99`,
  };

  return (
    <Collapse
      className='mt-3 bg-primary'
      bordered={false}
      defaultActiveKey={['1']}
      expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
      style={{ background: token.colorBgContainer, borderColor: token.colorPrimary }}
      items={getItems(panelStyle)}
    />
  )
}