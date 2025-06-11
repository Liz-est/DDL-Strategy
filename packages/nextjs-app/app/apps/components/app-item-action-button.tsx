"use client";
import { DeleteOutlined, EditOutlined, MoreOutlined } from "@ant-design/icons";
import { IDifyAppItem } from "@dify-chat/core";

import { Dropdown, message } from "antd";
import { useAppEditDrawer } from "../hooks/use-app-edit-drawer";
import { AppDetailDrawerModeEnum } from "../enums";
import { deleteApp } from "../actions";
import { redirect } from "next/navigation";

export default function AppItemActionButton(props: { item: IDifyAppItem }) {
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
								await fetch(`/api/app/${item.id}`, {
									method: "DELETE",
									headers: {
										"Content-Type": "application/json",
									},
								});
								message.success("删除应用成功");
								// 重新加载列表页
								redirect("/apps");
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
