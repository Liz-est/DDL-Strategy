"use client";
import { Logo } from "@/components";
import { message, Spin } from "antd";
import { getRunningModeAction, loginAction } from "./actions";
import { useUserId } from "@/hooks/useUserId";
import { useEffect } from "react";
import { redirect } from "next/navigation";

export default function LoginPage() {
	// 获取 userId
	const userId = useUserId();

	/**
	 * 调用登录 server action
	 */
	const authLogin = async (userId: string) => {
		// 登录
		await loginAction(userId);

		// 获取应用运行模式
		const runningMode = await getRunningModeAction();

		if (!runningMode) {
			message.error("获取运行模式失败，请检查配置");
			return;
		}

		message.success("登录成功");

		// 判断运行模式，区分跳转页面
		if (runningMode === "singleApp") {
			redirect("/");
		} else if (runningMode === "multiApp") {
			redirect("/apps");
		}
	};

	useEffect(() => {
		authLogin(userId);
	}, [userId]);

	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center bg-theme-bg">
			<div className="absolute flex-col w-full h-full left-0 top-0 z-50 flex items-center justify-center">
				<Logo hideGithubIcon />
				<div className="text-theme-text">授权登录中...</div>
				<div className="mt-6">
					<Spin spinning />
				</div>
			</div>
		</div>
	);
}
