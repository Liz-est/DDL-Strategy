export const RUNTIME_VARS_KEY = 'DIFY_CHAT__RUNTIME_VARS'

/**
 * 获取变量
 */
export const getVars = () => {
	const runtimeVars = JSON.parse(localStorage.getItem(RUNTIME_VARS_KEY) || '{}')
	return {
		DIFY_API_BASE: runtimeVars.DIFY_API_BASE || process.env.DIFY_API_BASE,
		DIFY_API_KEY: runtimeVars.DIFY_API_KEY || process.env.DIFY_API_KEY,
		DIFY_API_VERSION: runtimeVars.DIFY_API_VERSION || process.env.DIFY_API_VERSION,
	}
}

const DIFY_VERSION_KEY = 'DIFY_CHAT__DIFY_VERSION'

/**
 * 获取 Dify 版本
 */
export const DIFY_INFO = {
	get version() {
		return localStorage.getItem(DIFY_VERSION_KEY)	|| ''
	},

	set version(version: string) {
		localStorage.setItem(DIFY_VERSION_KEY, version)	
	}
}