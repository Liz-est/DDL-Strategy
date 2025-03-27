/**
 * 是否为临时 ID
 */
export const isTempId = (id: string | undefined) => {
	if (!id) {
		return false
	}
	return id.startsWith('temp')
}
