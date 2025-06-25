// import prisma from "@/lib/prisma";
import { systemConfig as systemConfigTable } from "@/drizzle/schema";
import { db } from "@/lib/drizzle";
import { eq } from "drizzle-orm";

export const getConfigByKey = async (key: string) => {
	// return prisma.system_config.findFirst({
	// 	where: {
	// 		key,
	// 	},
	// });
	const matchedLine = await db
		.select()
		.from(systemConfigTable)
		.where(eq(systemConfigTable.key, key));
	return matchedLine[0];
};

export const setConfigByKey = async (key: string, value: string) => {
	// 查询是否存在
	const config = await getConfigByKey(key);
	if (config) {
		// return prisma.system_config.update({
		// 	where: {
		// 		id: config.id,
		// 	},
		// 	data: {
		// 		value,
		// 	},
		// });
		await db
			.update(systemConfigTable)
			.set({
				key,
				value,
			})
			.where(eq(systemConfigTable.id, config.id));
		return {};
	}
	// return prisma.system_config.create({
	// 	data: {
	// 		key,
	// 		value,
	// 	},
	// });
	await db.insert(systemConfigTable).values({
		key,
		value,
	});
	return {};
};
