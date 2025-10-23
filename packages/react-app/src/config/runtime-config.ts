export interface RuntimeEnvConfig {
	PUBLIC_DEBUG_MODE?: string
	PUBLIC_APP_API_BASE?: string
	PUBLIC_DIFY_PROXY_API_BASE?: string
}

// 开发环境优先读 process.env，生产保持运行时注入
const isDev = process.env.NODE_ENV === 'development'

// 开发模式：用 process.env
const devEnv: RuntimeEnvConfig = isDev
	? {
			PUBLIC_DEBUG_MODE: process.env.PUBLIC_DEBUG_MODE,
			PUBLIC_APP_API_BASE: process.env.PUBLIC_APP_API_BASE,
			PUBLIC_DIFY_PROXY_API_BASE: process.env.PUBLIC_DIFY_PROXY_API_BASE,
		}
	: {}

// 生产模式：用 window.__DIFY_CHAT_ENV__
const runtimeEnv = (typeof window !== 'undefined' ? window.__DIFY_CHAT_ENV__ : undefined) as
	| RuntimeEnvConfig
	| undefined

const config: RuntimeEnvConfig = isDev
	? devEnv
	: {
			PUBLIC_DEBUG_MODE: runtimeEnv?.PUBLIC_DEBUG_MODE,
			PUBLIC_APP_API_BASE: runtimeEnv?.PUBLIC_APP_API_BASE,
			PUBLIC_DIFY_PROXY_API_BASE: runtimeEnv?.PUBLIC_DIFY_PROXY_API_BASE,
		}

export default config
export { config }
