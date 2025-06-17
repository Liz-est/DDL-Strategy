"use client";

import { DifyChatProvider } from "@dify-chat/core";
import DifyAppService from "@/services/app/apps";
import MultiAppLayout from "@/app/app/[appId]/layout/multi-app-layout";
import { getAllState } from "@/store";

export default function AppPage() {
	const userInfo = getAllState().user;
	return (
		<DifyChatProvider
			// @ts-expect-error TODO: 这里的 user 实际上已经没有任何作用了，只是为了避免 TS 类型错误留在这里
			value={{
				mode: "multiApp",
				appService: new DifyAppService(),
				enableSetting: userInfo.enableSetting,
			}}
		>
			<MultiAppLayout />
		</DifyChatProvider>
	);
}
