"use client";
import { getUserAction } from "@/app/actions";
import {
	getAppList,
	getRunningAppIdAction,
	setRunningAppIdAction,
} from "@/app/console/actions";

import { Empty, message, Row, Select } from "antd";

import AddButton from "@/app/console/components/add-button";
import AppItem from "@/app/console/components/app-item";
import Header from "@/components/layout/header-wrapper";
import { useState } from "react";
import { IDifyAppItem } from "@/types";
import { useMount } from "ahooks";
import { getRunningModeAction, setRunningModeAction } from "../actions/config";
import { IDifyChatMode } from "@dify-chat/core";
import { LucideIcon } from "@dify-chat/components";

export interface IRunningModeSwitchProps {
	value: IDifyChatMode;
	onChange: (value: string) => void;
}

const RunningModeOptions = [
	{
		label: "单应用模式",
		value: "singleApp",
	},
	{
		label: "多应用模式",
		value: "multiApp",
	},
];

export default function ConsolePage() {
	const [apps, setApps] = useState<IDifyAppItem[]>([]);
	const [user, setUser] = useState<{
		userId: string;
		enableSetting: boolean;
	}>({
		userId: "",
		enableSetting: false,
	});
	const [runningMode, setRunningMode] = useState<IDifyChatMode>("multiApp");
	const [runningAppId, setRunningAppId] = useState("");

	const handleRunningModeChange = async (value: string) => {
		await setRunningModeAction(value);
		await refreshRunningMode();
		message.success("切换成功");
	};

	const handleRunningAppIdChange = async (value: string) => {
		await setRunningAppIdAction(value);
		await refreshRunningAppId();
		message.success("切换成功");
	};

	const refreshRunningMode = async () => {
		const runningMode = await getRunningModeAction();
		setRunningMode(runningMode);
	};

	const refreshRunningAppId = async () => {
		const appId = await getRunningAppIdAction();
		setRunningAppId(appId || "");
	};

	const refreshAppList = async () => {
		const appsRes = await getAppList();
		setApps(appsRes);
	};

	const initData = async () => {
		const user = await getUserAction();
		refreshAppList();
		setUser(user);
	};

	useMount(() => {
		initData();
		refreshRunningMode();
		refreshRunningAppId();
	});

	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			<Header
				centerTitle={{
					title: "控制台",
					icon: "square-chevron-right",
				}}
				rightLink={{
					icon: "layout-grid",
					href: "/apps",
					title: "应用列表",
				}}
			/>
			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden">
				{/* 切换模式 */}
				<div className="flex items-center mb-6">
					<div className="flex items-center mx-4 text-lg">
						<div className="mr-2">运行模式:</div>
						<Select
							style={{ width: 200 }}
							value={runningMode}
							options={RunningModeOptions}
							onChange={handleRunningModeChange}
						/>
					</div>
					{runningMode === "singleApp" ? (
						<div className="flex items-center mx-4 text-lg">
							<div className="mr-2">当前运行应用:</div>
							<Select
								style={{ width: 200 }}
								value={runningAppId}
								options={apps.map((item) => {
									return {
										value: item.id,
										label: item.info.name,
									};
								})}
								onChange={handleRunningAppIdChange}
							/>
						</div>
					) : null}
				</div>

				<div className="px-4 md:px-6">
					<div className="text-lg mb-3 font-semibold flex items-center">
						<LucideIcon name="layout-grid" size={18} className="mr-1" />
						<div>应用列表</div>
					</div>
					{apps?.length ? (
						<Row gutter={[16, 16]}>
							{apps.map((item) => {
								return (
									<AppItem
										key={item.id}
										isCurrent={
											runningMode === "singleApp" && item.id === runningAppId
										}
										item={item}
										enableSetting={user.enableSetting}
										refreshAppList={refreshAppList}
									/>
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

			{user.enableSetting ? <AddButton refreshApps={refreshAppList} /> : null}
		</div>
	);
}
