import { genDifyRequest } from "@/app/api/utils";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	const user = await getUserIdFromNextRequest(_request);
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.post(`/files/upload`, {
		user,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
