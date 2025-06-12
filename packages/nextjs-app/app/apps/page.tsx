"use client";
import { getUser } from "@/app/actions";
import { getAppList } from "@/app/apps/actions";

import { Empty, Row } from "antd";

import AppItem from "@/app/apps/components/app-item";
import Header from "@/app/apps/components/header";
import { useMount } from "ahooks";
import { useState } from "react";
import { IDifyAppItem4View } from "@/types";

export default function AppsPage() {
	const [user, setUser] = useState<string>("");
	const [apps, setApps] = useState<IDifyAppItem4View[]>();

	const initData = async () => {
		const [userRes, appsRes] = await Promise.all([getUser(), getAppList()]);
		setUser(userRes.userId);
		setApps(appsRes);
	};

	useMount(() => {
		initData();
	});

	return (
		<div className="h-screen relative overflow-hidden flex flex-col bg-theme-bg w-full">
			<Header />
			<div className="flex-1 bg-theme-main-bg rounded-3xl py-6 overflow-y-auto box-border overflow-x-hidden">
				{apps?.length ? (
					<Row gutter={[16, 16]} className="px-3 md:px-6">
						{apps.map((item) => {
							return <AppItem key={item.id} item={item} user={user} />;
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
