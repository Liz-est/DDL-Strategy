"use client";

import { DifyChatProvider } from "@dify-chat/core";
import DifyAppService from "@/services/app/apps";
import MultiAppLayout from "@/app/app/[appId]/layout/multi-app-layout";
import { getAllState } from "@/store";

export default function AppPage() {
	const userInfo = getAllState().user;
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
