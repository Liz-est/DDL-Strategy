import { genDifyRequest } from "@/app/api/utils";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const PUT = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string; conversationId: string }> },
) => {
	const { appId, conversationId } = await params;
	// 获取 body 中的参数
	const { name, auto_generate } = await _request.json();
	if (!conversationId) {
		return NextResponse.json({
			code: 400,
			message:
				'Bad Request: lack of conversation_id. Please provide the "conversation_id" in your request.',
		});
	}
	const difyRequest = await genDifyRequest(appId);
	const user = await getUserIdFromNextRequest(_request);
	const result = await difyRequest.post(
		`/conversations/${conversationId}/name`,
		{
			conversation_id: conversationId,
			name,
			auto_generate,
			user,
		},
	);
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { PUT };
