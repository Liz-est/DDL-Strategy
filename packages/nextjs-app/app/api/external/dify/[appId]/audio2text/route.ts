import { genDifyRequest } from "@/app/api/utils";
import { NextRequest, NextResponse } from "next/server";

const POST = async (
	_request: NextRequest,
	{ params }: { params: Promise<{ appId: string }> },
) => {
	const { appId } = await params;
	const formData = await _request.formData();
	const difyRequest = await genDifyRequest(appId);

	// 构建新的 formData 以便转发到第三方
	const proxyFormData = new FormData();
	for (const [key, value] of formData.entries()) {
		// node 环境没有 File 构造函数，判断 value 是否为文件对象
		if (
			typeof value === "object" &&
			value !== null &&
			typeof value.arrayBuffer === "function" &&
			"name" in value // 一般文件对象有 name 属性
		) {
			proxyFormData.append(key, value, value.name);
		} else {
			proxyFormData.append(key, value as string);
		}
	}

	const result = await difyRequest.baseRequest(`/audio-to-text`, {
		method: "POST",
		body: proxyFormData,
	});
	return NextResponse.json({
		code: 200,
		data: await result.json(),
	});
};

export { POST };
