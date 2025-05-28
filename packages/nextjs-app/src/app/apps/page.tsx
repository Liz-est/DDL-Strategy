"use client";
import { HeaderLayout } from "@/components";
import { LucideIcon } from "@dify-chat/components";

export default function AppsPage() {
	return (
		<div>
			<HeaderLayout
				title={
					<div className="flex items-center">
						<LucideIcon name="layout-grid" size={16} className="mr-1" />
						应用列表
					</div>
				}
			/>
		</div>
	);
}
