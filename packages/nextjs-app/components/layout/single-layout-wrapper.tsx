"use client";
import SingleAppLayout from "@/app/app/[appId]/layout/single-app-layout";
import PageLayoutWrapper from "./page-layout-wrapper";
import { getAppConfig, setAppConfig } from "@/app/actions/app";

export default function SingleAppLayoutWrapper() {
	return (
		<PageLayoutWrapper>
			<SingleAppLayout
				getAppConfig={getAppConfig}
				setAppConfig={setAppConfig}
			/>
		</PageLayoutWrapper>
	);
}
