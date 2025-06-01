import { genDifyRequest } from "@/app/api/utils";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: { appId: string } },
) => {
	const { appId } = await params;
	// 获取 body 中的参数
	const { conversation_id, inputs, files, query } = await _request.json();
	const difyRequest = await genDifyRequest(appId);
	const user = _request.headers.get("dc-user") as string;
	const result = await difyRequest.post(`/chat-messages`, {
		conversation_id,
		inputs,
		files,
		response_mode: "blocking",
		user,
		query,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
