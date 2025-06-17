"use client";
import SingleAppLayout from "@/app/app/[appId]/layout/single-app-layout";
import { DifyChatProvider, IDifyAppItem } from "@dify-chat/core";
import PageLayoutWrapper from "./page-layout-wrapper";

export default function SingleAppLayoutWrapper(props: { app: IDifyAppItem }) {
	return (
		<PageLayoutWrapper>
			<DifyChatProvider
				value={{
					appConfig: props.app,
					mode: "singleApp",
					user: "lexmin",
				}}
			>
				<SingleAppLayout />
			</DifyChatProvider>
		</PageLayoutWrapper>
	);
}
