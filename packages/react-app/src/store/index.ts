import { create } from 'zustand'

interface GlobalStore {
	globalParams: Record<string, string>
	setGlobalParams: (params: Record<string, string>) => void
}

export const useGlobalStore = create<GlobalStore>(set => ({
	globalParams: {},
	setGlobalParams: (params: Record<string, string>) =>
		set(state => ({
			globalParams: { ...state.globalParams, ...params },
		})),
}))
