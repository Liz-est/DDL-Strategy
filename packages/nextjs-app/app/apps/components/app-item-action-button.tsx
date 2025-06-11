"use client";
import { DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import { IDifyAppItem } from "@dify-chat/core";

import { Dropdown, message } from "antd";
import { useAppEditDrawer } from "../hooks/use-app-edit-drawer";
import { AppDetailDrawerModeEnum } from "../enums";
import { deleteApp } from "../actions";

export default function AppItemActionButton(props: {
	item: IDifyAppItem;
	// deleteApp: Promise<void>;
}) {
	const { item } = props;
	const {
		setAppEditDrawerMode,
		setAppEditDrawerOpen,
		setAppEditDrawerAppItem,
		drawerComponent,
	} = useAppEditDrawer();
	return (
		<>
			<Dropdown
				menu={{
					items: [
						{
							key: "edit",
							icon: <EditOutlined />,
							label: "编辑",
							onClick: () => {
								setAppEditDrawerMode(AppDetailDrawerModeEnum.edit);
								setAppEditDrawerOpen(true);
								setAppEditDrawerAppItem(item);
							},
						},
						{
							key: "delete",
							icon: <DeleteOutlined />,
							label: "删除",
							danger: true,
							onClick: async () => {
								await deleteApp(item.id);
								message.success("删除应用成功");
								// TODO: 刷新应用列表
								// getAppList();
							},
						},
					],
				}}
			>
				<MoreOutlined className="absolute right-3 top-3 text-lg" />
			</Dropdown>
			{drawerComponent}
		</>
	);
}
