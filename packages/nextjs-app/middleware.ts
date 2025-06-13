import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getConfigs } from "./config/env";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 对所有资源访问进行 session 非空校验
	const session = request.cookies.get("session");
	// 如果不存在则重定向到登录页
	if (!session) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}

	const { runningMode } = getConfigs();
	// 如果是单应用模式下访问了多应用的页面，则重定向到首页，由首页自行分流到单应用页面
	if (pathname.startsWith("/app")) {
		if (runningMode === "singleApp") {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}
}
