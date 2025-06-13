import { genDifyRequest } from "@/app/api/utils";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const GET = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string; conversationId: string }> },
) => {
	const { appId, conversationId } = await params;
	const user = await getUserIdFromNextRequest(_request);
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.get(`/messages`, {
		user,
		conversation_id: conversationId,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { GET };
