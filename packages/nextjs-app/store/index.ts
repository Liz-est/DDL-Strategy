import { IRunningMode } from "@/types";
import { ThemeEnum, ThemeModeEnum } from "@dify-chat/theme";

// 定义 IAllState 接口，仅描述状态的类型，不包含具体取值逻辑
export interface IAllState {
	themeState: ThemeEnum;
	themeMode: ThemeModeEnum;
	user: {
		userId: string;
		enableSetting: boolean;
	};
	runningMode: IRunningMode;
}

export const getAllState = (): IAllState => {
	// 兼容构建时的服务端预渲染获取不到浏览器 API 的场景
	if (typeof window === "undefined") {
		return {
			themeState: ThemeEnum.LIGHT,
			themeMode: ThemeModeEnum.SYSTEM,
			user: {
				userId: "",
				enableSetting: false,
			},
			runningMode: "singleApp",
		};
	}
	return {
		themeState:
			(localStorage.getItem("__DC_THEME") as ThemeEnum) || ThemeEnum.LIGHT,
		themeMode:
			(localStorage.getItem("__DC_THEME_MODE") as ThemeModeEnum) ||
			ThemeModeEnum.SYSTEM,
		user: JSON.parse(localStorage.getItem("__DC_USER") || "{}") as {
			userId: string;
			enableSetting: boolean;
		},
		runningMode: localStorage.getItem("DC_RUNNING_MODE") as IRunningMode,
	} as const;
};

export const getState = (key: keyof IAllState): IAllState[keyof IAllState] => {
	return getAllState()[key];
};
