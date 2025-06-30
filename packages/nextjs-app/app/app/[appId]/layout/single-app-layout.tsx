"use client";
import { AppContextProvider, DEFAULT_APP_SITE_SETTING } from "@dify-chat/core";
import { useMount, useRequest } from "ahooks";
import { message, Spin } from "antd";
import React, { useState } from "react";

import MainLayout from "@/app/app/[appId]/layout/main-layout";
import { getUserAction } from "@/app/actions";
import { IDifyAppItem } from "@/types";
import { ICurrentApp } from "@/app/app/[appId]/types";
import { AppEditDrawer } from "@/app/apps/components/app-edit-drawer";
import { AppDetailDrawerModeEnum } from "@/app/apps/enums";
import { DifyApi } from "@/services/dify";

interface ISingleAppLayoutProps {
	getAppConfig: () => Promise<IDifyAppItem | undefined>;
	setAppConfig: (appConfig: IDifyAppItem) => Promise<unknown>;
}

const SingleAppLayout = (props: ISingleAppLayoutProps) => {
	const { getAppConfig, setAppConfig } = props;
	const [selectedAppId, setSelectedAppId] = useState("");
	const [initLoading, setInitLoading] = useState(false);
	const [currentApp, setCurrentApp] = useState<ICurrentApp>(); // 新增 currentApp 状态用于保存当前应用的 info
	const { data: userInfo = { userId: "" } } = useRequest(() => {
		return getUserAction();
	});
	const [appEditDrawerMode, setAppEditDrawerMode] = useState<
		AppDetailDrawerModeEnum | undefined
	>(undefined);
	const [appEditDrawerOpen, setAppEditDrawerOpen] = useState(false);
	const [appEditDrawerAppItem, setAppEditDrawerAppItem] = useState<
		IDifyAppItem | undefined
	>(undefined);

	const initInSingleMode = async () => {
		const appConfig = (await getAppConfig()) as IDifyAppItem;
		console.log("appConfig", appConfig);
		if (!appConfig) {
			message.error("请先配置应用");
			setAppEditDrawerMode(AppDetailDrawerModeEnum.create);
			setAppEditDrawerOpen(true);
			setAppEditDrawerAppItem(undefined);
			return;
		}

		setInitLoading(true);
		const newDifyApi = new DifyApi({
			user: userInfo.userId,
			appId: appConfig.id,
		});
		const [difyAppInfo, appParameters, appSiteSetting] = await Promise.all([
			newDifyApi.getAppInfo(),
			newDifyApi.getAppParameters(),
			newDifyApi
				.getAppSiteSetting()
				.then((res) => {
					return res;
				})
				.catch((err) => {
					console.error(err);
					console.warn(
						"Dify 版本提示: 获取应用 WebApp 设置失败，已降级为使用默认设置。如需与 Dify 配置同步，请确保你的 Dify 版本 >= v1.4.0",
					);
					return DEFAULT_APP_SITE_SETTING;
				}),
		]);
		setSelectedAppId(appConfig.id);
		// 获取应用信息
		setCurrentApp({
			config: {
				...appConfig,
				info: {
					...difyAppInfo,
					// 这里使用用户传入配置覆盖接口获取到的信息，是为了兼容旧版本(<=v1.3.1)的 /info 接口没有返回 mode 的情况
					...appConfig.info,
				},
			},
			parameters: appParameters,
			site: appSiteSetting,
		});
		setInitLoading(false);
	};

	// 初始化获取应用配置
	useMount(() => {
		initInSingleMode();
	});

	if (initLoading) {
		return (
			<div className="absolute w-full h-full left-0 top-0 z-50 flex items-center justify-center">
				<Spin spinning />
			</div>
		);
	}

	return (
		<>
			{currentApp && selectedAppId ? (
				<AppContextProvider
					value={{
						appLoading: initLoading,
						currentAppId: selectedAppId,
						setCurrentAppId: setSelectedAppId,
						currentApp: currentApp,
						setCurrentApp,
					}}
				>
					<MainLayout
						// difyApi={difyApi}
						initLoading={false}
						renderCenterTitle={(appInfo) => {
							return <>{appInfo?.name}</>;
						}}
					/>
				</AppContextProvider>
			) : null}

			{/* 应用配置编辑抽屉 */}
			<AppEditDrawer
				detailDrawerMode={appEditDrawerMode!}
				open={appEditDrawerOpen}
				onClose={() => setAppEditDrawerOpen(false)}
				appItem={appEditDrawerAppItem}
				confirmCallback={() => {
					initInSingleMode();
				}}
				addApi={setAppConfig}
				updateApi={setAppConfig}
			/>
		</>
	);
};

export default SingleAppLayout;
