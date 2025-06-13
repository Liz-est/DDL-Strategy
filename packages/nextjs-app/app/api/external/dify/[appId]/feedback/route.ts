import { genDifyRequest } from "@/app/api/utils";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			appId: string;
			conversationId: string;
			messageId: string;
		}>;
	},
) => {
	const { appId } = await params;
	const { rating, content, messageId } = await _request.json();
	const user = await getUserIdFromNextRequest(_request);
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.post(`/messages/${messageId}/feedbacks`, {
		user,
		rating,
		content,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
