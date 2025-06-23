import prisma from "@/lib/prisma";

export const getConfigByKey = async (key: string) => {
	return prisma.system_config.findFirst({
		where: {
			key,
		},
	});
};

export const setConfigByKey = async (key: string, value: string) => {
	// 查询是否存在
	const config = await getConfigByKey(key);
	if (config) {
		return prisma.system_config.update({
			where: {
				id: config.id,
			},
			data: {
				value,
			},
		});
	}
	return prisma.system_config.create({
		data: {
			key,
			value,
		},
	});
};
