export interface RuntimeEnvConfig {
	PUBLIC_DEBUG_MODE?: string
	PUBLIC_APP_API_BASE?: string
	PUBLIC_DIFY_PROXY_API_BASE?: string
}

// Read runtime environment injected on window
const runtimeEnv = (typeof window !== 'undefined' ? window.__DIFY_CHAT_ENV__ : undefined) as
	| RuntimeEnvConfig
	| undefined

const config: RuntimeEnvConfig = {
	PUBLIC_DEBUG_MODE: runtimeEnv?.PUBLIC_DEBUG_MODE,
	PUBLIC_APP_API_BASE: runtimeEnv?.PUBLIC_APP_API_BASE,
	PUBLIC_DIFY_PROXY_API_BASE: runtimeEnv?.PUBLIC_DIFY_PROXY_API_BASE,
}

export default config
export { config }
