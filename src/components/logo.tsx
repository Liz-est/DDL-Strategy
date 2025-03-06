import { GithubOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Modal } from "antd";
import { getVars, RUNTIME_VARS_KEY } from "../utils/vars";
import { useEffect } from "react";

interface ILogoProps {
  onSettingUpdated: () => void;
}

export const Logo = (props: ILogoProps) => {

  const { onSettingUpdated } = props;
  const [settingForm] = Form.useForm();

	useEffect(() => {
		const vars = getVars();
		const isInstanceReady = !!vars.DIFY_API_KEY && !!vars.DIFY_API_BASE;
		if (!isInstanceReady) {
      openSettingModal();
    }
	}, [])

	const openSettingModal = async() => {
		const initialValues = getVars();
    Modal.confirm({
      width: 600,
      title: '配置',
      content: (
        <Form
          form={settingForm}
          labelAlign="left"
          labelCol={{
            span: 5,
          }}
          initialValues={initialValues}
        >
          <Form.Item
            label="API BASE"
            name="DIFY_API_BASE"
            rules={[{ required: true }]}
            required
          >
            <Input placeholder="请输入 API BASE" />
          </Form.Item>
          <Form.Item
            label="API Version"
            name="DIFY_API_VERSION"
            rules={[{ required: true }]}
            required
          >
            <Input placeholder="请输入 API Version" />
          </Form.Item>
          <Form.Item
            label="API Key"
            name="DIFY_API_KEY"
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
        localStorage.setItem(RUNTIME_VARS_KEY, JSON.stringify(values));
        message.success('更新配置成功');
        onSettingUpdated();
      },
    });
	}

	return (
    <div className="flex h-16 items-center justify-start py-0 px-6 box-border">
      <div className="h-full flex items-center flex-1 overflow-hidden">
        <img
          className="w-6 h-6 inline-block"
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable={false}
          alt="logo"
        />
        <span className="inline-block my-0 mx-2 font-bold text-desc text-lg">
          Dify Chat
        </span>
      </div>
      <div>
        <Button
          type="link"
          onClick={openSettingModal}
        >
          <SettingOutlined className="text-lg cursor-pointer" />
        </Button>
        <Button
          type="link"
          href="https://github.com/lexmin0412/dify-chat"
          target="_blank"
          className="px-0"
        >
          <GithubOutlined className="text-lg cursor-pointer text-[#333]" />
        </Button>
      </div>
    </div>
  );
}
