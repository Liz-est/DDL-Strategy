"use server";

import { getConfigs } from "@/config";
import { createSession } from "@/lib/session";

/**
 * 登录 server action
 * 简单的用户登录实现，可以改造为用户信息表单，如账号+密码
 */
export const loginAction = async (userId: string) => {
	return createSession(userId);
};

/**
 * 获取运行模式
 */
export const getRunningModeAction = async () => {
	return getConfigs().runningMode;
};
