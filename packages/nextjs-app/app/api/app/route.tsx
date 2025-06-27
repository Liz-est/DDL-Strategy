import { addApp } from "@/services/app";
import { NextRequest, NextResponse } from "next/server";

/**
 * 创建应用
 */
export async function POST(request: NextRequest) {
	// 获取 body
	const body = await request.json();
	await addApp(body);
	return NextResponse.json({
		code: 0,
		data: null,
		message: "success",
	});
}
