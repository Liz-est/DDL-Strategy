"use server";
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

/**
 * 删除应用
 */
export async function deleteApp(id: string) {
	const res = await fetch(
		`${process.env.__NEXT_PRIVATE_ORIGIN}/api/app/${id}`,
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	return res.json();
}

export async function createApp(appItem: Omit<IDifyAppItem, "id">) {
	const res = await fetch(`${process.env.__NEXT_PRIVATE_ORIGIN}/api/app`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(appItem),
	});
	return res.json();
}

export async function updateApp(appItem: IDifyAppItem) {
	const res = await fetch(
		`${process.env.__NEXT_PRIVATE_ORIGIN}/api/app/${appItem.id}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(appItem),
		},
	);
	return res.json();
}
