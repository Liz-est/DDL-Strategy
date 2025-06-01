import { genDifyRequest } from "@/app/api/utils";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: { appId: string } },
) => {
	const { appId } = await params;
	const body = await _request.json();
	const { message_id, text } = body;
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.post(`/text-to-audio`, {
		message_id,
		text,
		user: _request.headers.get("dc-user") as string,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
