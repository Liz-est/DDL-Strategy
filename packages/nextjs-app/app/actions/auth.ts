"use server";

import { createSession, decrypt } from "@/lib/session";
import { cookies } from "next/headers";

/**
 * 获取用户信息
 * 简单的实现，实际场景中可以根据 userId 从数据库中查询用户信息
 */
export const getUserAction = async () => {
	const cookieStore = await cookies();
	const decyptRes = await decrypt(
		cookieStore.get("__DC_SESSION")?.value as string,
	);
	return {
		userId: decyptRes?.userId as string,
		enableSetting: decyptRes.enableSetting,
	};
};

/**
 * 登录 server action
 * 简单的用户登录实现，入参可以改造为用户信息表单，如账号+密码
 */
export const loginAction = async (userId: string) => {
	const sessionInfo = {
		userId,
		// 为方便演示，默认开启设置，实际场景中需要根据用户信息判断是否开启设置
		enableSetting: true,
	};
	await createSession(sessionInfo);
	return sessionInfo;
};
