"use client";
import { HeaderLayout } from "@/components";
import { LucideIcon } from "@dify-chat/components";

export default function Header() {
	return (
		<HeaderLayout
			title={
				<div className="flex items-center">
					<LucideIcon name="square-chevron-right" size={16} className="mr-1" />
					控制台
				</div>
			}
		/>
	);
}
