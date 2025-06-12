"use client";
import { LucideIcon } from "@dify-chat/components";

export default function Page() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
			}}
		>
			<LucideIcon name="lock-keyhole" size={64} />
			<h1 className="text-3xl text-red-500 my-4">401 Unauthorized</h1>
			<p className="text-lg text-[#8c8c8c]">未登录或登录已过期，请重新登录。</p>
		</div>
	);
}
