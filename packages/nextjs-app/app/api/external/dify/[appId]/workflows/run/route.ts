import { genDifyRequest, genDifyResponseProxy } from "@/app/api/utils";
import { RESPONSE_MODE } from "@/config";
import { getUserIdFromNextRequest } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const GET = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.get(
		`/workflows/run/${_request.nextUrl.searchParams.get("id")}`,
	);
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	const { inputs } = await _request.json();
	const user = await getUserIdFromNextRequest(_request);
	const difyRequest = await genDifyRequest(appId);
	const response = await difyRequest.baseRequest(`/workflows/run`, {
		method: "POST",
		body: JSON.stringify({
			response_mode: RESPONSE_MODE,
			user,
			inputs,
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});
	return genDifyResponseProxy(response);
};

export { GET, POST };
