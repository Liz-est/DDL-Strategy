"user server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt, SESSION_KEY_NAME } from "./lib/session";

// let runningMode = "";

export async function middleware(request: NextRequest) {
	// 对所有资源访问进行 session 非空校验
	const session = request.cookies.get(SESSION_KEY_NAME);
	// 如果不存在则重定向到登录页
	if (!session?.value) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}
	// 验证 Session
	const decodedSession = await decrypt(session.value);
	if (decodedSession.error) {
		// Session 验证失败，重定向到登录页
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	// TODO: runningMode 获取，需要更好的方式。
	// if (!runningMode) {
	// 	const result = await fetch(
	// 		new URL("/api/internal/running-mode", request.url),
	// 		{
	// 			headers: {
	// 				"Content-type": "application/json",
	// 			},
	// 		},
	// 	)
	// 		.then((res) => res.json())
	// 		.then((res) => res.data);
	// 	runningMode = result;
	// }

	// // 如果是单应用模式下访问了多应用的页面，则重定向到首页，由首页自行分流到单应用页面
	// if (pathname.startsWith("/app")) {
	// 	if (runningMode === RunningModes.SingleApp) {
	// 		return NextResponse.redirect(new URL("/", request.url));
	// 	}
	// }
}

export const config = {
	matcher: [
		"/",
		"/api/app/:path*",
		"/api/apps/:path*",
		"/api/external/:path*",
		"/app/:path*",
		"/apps",
	],
};
