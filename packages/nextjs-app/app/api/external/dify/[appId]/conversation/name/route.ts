import { genDifyRequest } from "@/app/api/utils";
import { NextRequest, NextResponse } from "next/server";

const PUT = async (
	_request: NextRequest,
	{ params }: { params: { appId: string } },
) => {
	const { appId } = await params;
	// 获取 body 中的参数
	const { conversation_id, name, auto_generate } = await _request.json();
	if (!conversation_id) {
		return NextResponse.json({
			code: 400,
			message:
				'Bad Request: lack of conversation_id. Please provide the "conversation_id" in your request.',
		});
	}
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.post(
		`/conversations/${conversation_id}/name`,
		{
			conversation_id,
			name,
			auto_generate,
			user: _request.headers.get("dc-user") as string,
		},
	);
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { PUT };
