import { genDifyRequest, genDifyResponseProxy } from "@/app/api/utils";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	// 获取 body 中的参数
	const { conversation_id, inputs, files, query, response_mode } =
		await _request.json();
	const difyRequest = await genDifyRequest(appId);
	const userId = await getUserIdFromNextRequest(_request);

	const response = await difyRequest.baseRequest(`/chat-messages`, {
		method: "POST",
		body: JSON.stringify({
			conversation_id,
			inputs,
			files,
			response_mode,
			user: userId,
			query,
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});

	return genDifyResponseProxy(response);
};

export { POST };
