"use client";
import { HeaderLayout } from "@/components";
import { TagOutlined } from "@ant-design/icons";
import { LucideIcon } from "@dify-chat/components";
import { AppModeEnums, AppModeLabels, IDifyAppItem } from "@dify-chat/core";
import { useIsMobile } from "@dify-chat/helpers";
import { Col, Empty, Row } from "antd";
import { useRouter } from "next/navigation";

export default function AppsPage() {
	const router = useRouter();
	const isMobile = useIsMobile();
	const list: IDifyAppItem[] = [
		{
			id: "1",
			info: {
				name: "测试应用",
				description: "这是一个测试应用",
				mode: AppModeEnums.CHATFLOW,
				tags: ["测试"],
			},
			requestConfig: {
				apiBase: "https://api.dify.ai/v1",
				apiKey: "app-xxx",
			},
		},
	];

	return (
		<div className="h-screen relative overflow-hidden flex flex-col w-full">
			<HeaderLayout
				title={
					<div className="flex items-center">
						<LucideIcon name="layout-grid" size={16} className="mr-1" />
						应用列表
					</div>
				}
			/>

			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden">
				{list?.length ? (
					<Row gutter={[16, 16]} className="px-3 md:px-6">
						{list.map((item) => {
							const hasTags = item.info.tags?.length;
							return (
								<Col key={item.id} span={isMobile ? 24 : 6}>
									<div
										key={item.id}
										className={`relative group p-3 bg-theme-btn-bg border border-solid border-theme-border rounded-2xl cursor-pointer hover:border-primary hover:text-primary`}
									>
										<div
											onClick={() => {
												router.push(`/app/${item.id}`);
											}}
										>
											<div className="flex items-center overflow-hidden">
												<div className="h-10 w-10 bg-[#ffead5] dark:bg-transparent border border-solid border-transparent dark:border-theme-border rounded-lg flex items-center justify-center">
													<LucideIcon
														name="bot"
														className="text-xl text-theme-text"
													/>
												</div>
												<div className="flex-1 overflow-hidden ml-3 text-theme-text h-10 flex flex-col justify-between">
													<div className="truncate font-semibold pr-4">
														{item.info.name}
													</div>
													<div className="text-theme-desc text-xs mt-0.5">
														{item.info.mode
															? AppModeLabels[item.info.mode]
															: "unknown"}
													</div>
												</div>
											</div>
											<div className="text-sm mt-3 h-10 overflow-hidden text-ellipsis leading-5 whitespace-normal line-clamp-2 text-theme-desc">
												{item.info.description || "暂无描述"}
											</div>
										</div>
										<div className="flex items-center text-desc truncate mt-3 h-4">
											{hasTags ? (
												<>
													<TagOutlined className="mr-2" />
													{item.info.tags.join("、")}
												</>
											) : null}
										</div>

										{/* 操作图标 */}
										{/* {enableSetting && !appService.readonly ? (
											<Dropdown
												menu={{
													items: [
														{
															key: 'edit',
															icon: <EditOutlined />,
															label: '编辑',
															onClick: () => {
																setAppEditDrawerMode(AppDetailDrawerModeEnum.edit)
																setAppEditDrawerOpen(true)
																setAppEditDrawerAppItem(item)
															},
														},
														{
															key: 'delete',
															icon: <DeleteOutlined />,
															label: '删除',
															danger: true,
															onClick: async () => {
																await (appService as DifyAppStore).deleteApp(item.id)
																message.success('删除应用成功')
																getAppList()
															},
														},
													],
												}}
											>
												<MoreOutlined className="absolute right-3 top-3 text-lg" />
											</Dropdown>
										) : null} */}
									</div>
								</Col>
							);
						})}
					</Row>
				) : (
					<div className="w-full h-full box-border flex flex-col items-center justify-center px-3">
						<Empty description="暂无应用" />
					</div>
				)}
			</div>
		</div>
	);
}
