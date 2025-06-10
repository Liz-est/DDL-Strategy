"use server";

export async function getUser() {
	const promise = new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				userId: "lexmin",
				enableSetting: true,
				mode: process.env.RUNNING_MODE,
			});
		}, 1000);
	});
	return promise as Promise<{
		userId: string;
		enableSetting: boolean;
		mode: string;
	}>;
}
