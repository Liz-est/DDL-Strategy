import React, { useContext, useMemo, useState } from 'react'

interface IConversationItem {
	created_at: number
	id: string
	inputs: Record<string, unknown>
	introduction: string
	name: string
	status: 'normal'
	updated_at: number
}

/**
 * 对话上下文类型
 */
export interface IConversationContext {
	conversations: IConversationItem[]
	setConversations: (conversations: IConversationItem[]) => void
	currentConversationId: string
	setCurrentConversationId: (currentConversationId: string) => void
	currentConversationInfo?: IConversationItem
}

const DEFAULT_CONVERSATION_CONTEXT: IConversationContext = {
	conversations: [],
	setConversations: () => {},
	currentConversationId: '',
	setCurrentConversationId: () => {},
	currentConversationInfo: undefined,
}

/**
 * 对话上下文
 */
export const ConversationContext = React.createContext<IConversationContext>(
	DEFAULT_CONVERSATION_CONTEXT,
)

/**
 * 对话上下文 Provoder
 */
export const ConversationsContextProvider = ConversationContext.Provider

/**
 * 获取对话上下文
 */
export default function useConversationsContext() {
	const context = useContext(ConversationContext)
	return context
}

export const useConversations = () => {
	const [conversations, setConversations] = useState<IConversationItem[]>([])
	const [currentConversationId, setCurrentConversationId] = useState<string>()
	const currentConversationInfo = useMemo(() => {
		return conversations.find(item => item.id === currentConversationId)
	}, [conversations, currentConversationId])

	return {
		conversations,
		setConversations,
		currentConversationId,
		setCurrentConversationId,
		currentConversationInfo,
	}
}
