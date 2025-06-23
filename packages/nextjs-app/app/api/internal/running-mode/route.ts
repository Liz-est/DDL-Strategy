import { getRunningModeAction } from "@/app/actions";
import { NextResponse } from "next/server";

export const GET = async () => {
	const runningMode = await getRunningModeAction();
	return NextResponse.json({
		code: 0,
		data: runningMode,
		message: "success",
	});
};
