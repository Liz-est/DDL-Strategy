import { genDifyRequest } from "@/app/api/utils";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	const { inputs } = await _request.json();
	const difyRequest = await genDifyRequest(appId);
	const user = await getUserIdFromNextRequest(_request);
	const result = await difyRequest.baseRequest(`/completion-messages`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			response_mode: "blocking",
			user,
			inputs,
		}),
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
