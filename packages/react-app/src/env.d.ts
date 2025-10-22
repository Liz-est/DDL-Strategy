/// <reference types="@rsbuild/core/types" />
import { RuntimeEnvConfig } from './config'

export {}

declare global {
	interface Window {
		__DIFY_CHAT_ENV__?: RuntimeEnvConfig
	}
}
