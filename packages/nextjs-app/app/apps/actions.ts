"use server";
import { IDifyAppItem, IDifyAppItem4View } from "@/types";
import { GET } from "@/app/api/apps/route";

export async function getAppList() {
	const res = await GET();
	const data = await res.json();
	return (data as IDifyAppItem[]).map((item) => {
		return {
			id: item.id,
			info: item.info,
		};
	}) as IDifyAppItem4View[];
}
