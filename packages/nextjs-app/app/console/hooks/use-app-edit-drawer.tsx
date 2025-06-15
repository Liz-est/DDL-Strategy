import { useState } from "react";
import { AppDetailDrawerModeEnum } from "@/app/console/enums";
import { IDifyAppItem } from "@dify-chat/core";
import { AppEditDrawer } from "@/app/console/components/app-edit-drawer";

export const useAppEditDrawer = (callbacks?: {
	successCallback?: () => void;
}) => {
	const [appEditDrawerMode, setAppEditDrawerMode] =
		useState<AppDetailDrawerModeEnum>();
	const [appEditDrawerOpen, setAppEditDrawerOpen] = useState(false);
	const [appEditDrawerAppItem, setAppEditDrawerAppItem] =
		useState<IDifyAppItem>();

	const drawerComponent = (
		<AppEditDrawer
			detailDrawerMode={appEditDrawerMode!}
			open={appEditDrawerOpen}
			onClose={() => setAppEditDrawerOpen(false)}
			appItem={appEditDrawerAppItem}
			confirmCallback={() => {
				// TODO 调用应用列表接口刷新数据
				// getAppList();
				callbacks?.successCallback?.();
			}}
		/>
	);

	return {
		drawerComponent,
		appEditDrawerMode,
		setAppEditDrawerMode,
		appEditDrawerOpen,
		setAppEditDrawerOpen,
		appEditDrawerAppItem,
		setAppEditDrawerAppItem,
	};
};
