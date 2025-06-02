"use client";

// 只有放在页面入口才能生效
import "@ant-design/v5-patch-for-react-19";

import { DifyChatProvider } from "@dify-chat/core";
import DifyAppService from "@/services/app/apps";
import MultiAppLayout from "./layout/multi-app-layout";
import { useUserId } from "@/hooks/useUserId";

export default function AppPage() {
	const user = useUserId();
	return (
		<DifyChatProvider
			value={{
				mode: "multiApp",
				appService: new DifyAppService(),
				enableSetting: true,
				user,
			}}
		>
			<MultiAppLayout />
		</DifyChatProvider>
	);
}
