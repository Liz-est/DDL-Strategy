import { genDifyRequest } from "@/app/api/utils";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	const formData = await _request.formData();
	const difyRequest = await genDifyRequest(appId);
	const result = await difyRequest.baseRequest(`/audio-to-text`, {
		method: "POST",
		body: formData,
		headers: {
			"Content-Type": "multipart/form-data",
		},
	});
	return NextResponse.json({
		code: 200,
		data: result,
	});
};

export { POST };
