import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getConfigs } from "./config/env";
import { decrypt, SESSION_KEY_NAME } from "./lib/session";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

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

	const { runningMode } = getConfigs();
	// 如果是单应用模式下访问了多应用的页面，则重定向到首页，由首页自行分流到单应用页面
	if (pathname.startsWith("/app")) {
		if (runningMode === "singleApp") {
			return NextResponse.redirect(new URL("/", request.url));
		}
	}
}

export const config = {
	matcher: ["/", "/api/:path*", "/app/:path*", "/apps", "/console"],
};
