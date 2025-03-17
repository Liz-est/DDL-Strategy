import React, { useContext } from "react";

interface IDifyChatContext {
  /**
   * 用户 ID, 用于传递给 dify API 的用户唯一标识
   */
  user: string
}

const DEFAULT_CONTEXT_VALUE: IDifyChatContext = {
  user: ''
}

/**
 * DifyChat 全局上下文
 */
export const DifyChatContext = React.createContext<IDifyChatContext>(DEFAULT_CONTEXT_VALUE)

/**
 * DifyChatContext 的 Provider
 */
export const DifyChatProvider = DifyChatContext.Provider

/**
 * 使用 DifyChat 的 context 值
 */
export const useDifyChat = () => {
  return useContext(DifyChatContext)
}