import { NextRequest, NextResponse } from "next/server";
import { getAppList } from "../route";

/**
 * 获取应用详情
 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: { appId: string } },
) {
	const { appId } = params;
	const data = await getAppList();
	const app = data.find((item) => item.id === appId);
	if (!app) {
		return NextResponse.json({
			error: `找不到应用: ${appId}`,
		});
	}
	return NextResponse.json(app);
}
