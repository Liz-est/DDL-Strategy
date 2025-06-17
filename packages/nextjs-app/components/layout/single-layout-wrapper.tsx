"use client";
import SingleAppLayout from "@/app/app/[appId]/layout/single-app-layout";
import { DifyChatProvider, IDifyAppItem } from "@dify-chat/core";
import PageLayoutWrapper from "./page-layout-wrapper";

export default function SingleAppLayoutWrapper(props: { app: IDifyAppItem }) {
	return (
		<PageLayoutWrapper>
			<DifyChatProvider
				// @ts-expect-error TODO: 这里的 user 实际上已经没有任何作用了，只是为了避免 TS 类型错误留在这里
				value={{
					appConfig: props.app,
					mode: "singleApp",
				}}
			>
				<SingleAppLayout />
			</DifyChatProvider>
		</PageLayoutWrapper>
	);
}
