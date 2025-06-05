"use client";
import SingleAppLayout from "@/app/app/[appId]/layout/single-app-layout";
import { DifyChatProvider, IDifyAppItem } from "@dify-chat/core";

export default function SingleAppLayoutWrapper(props: { app: IDifyAppItem }) {
	return (
		<DifyChatProvider
			value={{
				appConfig: props.app,
				mode: "singleApp",
				user: "lexmin",
			}}
		>
			<SingleAppLayout />
		</DifyChatProvider>
	);
}
