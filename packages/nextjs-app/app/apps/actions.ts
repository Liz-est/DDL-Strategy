import { IDifyAppItem } from "@/app/api-utils";
import { GET } from "@/app/api/apps/route";

export async function getAppList() {
	const res = await GET();
	const data = await res.json();
	return (data as IDifyAppItem[]).map((item) => {
		return {
			...item,
			requestConfig: {
				apiBase: "xxx",
				apiKey: "xxx",
			},
		} as IDifyAppItem;
	});
}
