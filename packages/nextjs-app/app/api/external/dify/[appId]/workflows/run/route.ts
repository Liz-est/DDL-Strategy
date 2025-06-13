import { genDifyRequest } from "@/app/api/utils";
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
	const result = await difyRequest.post(`/workflows/run`, {
		response_mode: "blocking",
		user,
		inputs,
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { GET, POST };
