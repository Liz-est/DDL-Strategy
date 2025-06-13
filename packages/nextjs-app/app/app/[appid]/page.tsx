"use client";

import { DifyChatProvider } from "@dify-chat/core";
import DifyAppService from "@/services/app/apps";
import MultiAppLayout from "./layout/multi-app-layout";

export default function AppPage() {
	const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
	return (
		<DifyChatProvider
			value={{
				mode: "multiApp",
				appService: new DifyAppService(),
				enableSetting: userInfo.enableSetting,
				user: userInfo.userId as string,
			}}
		>
			<MultiAppLayout />
		</DifyChatProvider>
	);
}
