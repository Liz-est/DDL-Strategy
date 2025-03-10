/**
 * 是否为临时 ID
 */
export const isTempId = (id: string | undefined) => {
	return id?.startsWith('temp');
};