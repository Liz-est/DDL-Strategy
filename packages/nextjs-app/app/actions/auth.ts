"use server";

import { createSession, decrypt } from "@/lib/session";

/**
 * 默认是否允许编辑配置
 */
const DEFAULT_ENABLE_SETTING = true;

/**
 * 获取用户信息
 * 简单的实现，实际场景中可以根据 userId 从数据库中查询用户信息
 */
export const getUserAction = async () => {
	const { userId } = await decrypt();
	return {
		userId: userId as string,
		enableSetting: DEFAULT_ENABLE_SETTING,
	};
};

/**
 * 登录 server action
 * 简单的用户登录实现，入参可以改造为用户信息表单，如账号+密码
 */
export const loginAction = async (userId: string) => {
	const sessionInfo = {
		userId,
		enableSetting: DEFAULT_ENABLE_SETTING,
	};
	await createSession(sessionInfo);
	return sessionInfo;
};
