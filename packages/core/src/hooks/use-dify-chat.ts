import React, { useContext } from "react";
import { DifyAppStore } from "../storage";

interface IDifyChatContext {
  /**
   * 用户 ID, 用于传递给 dify API 的用户唯一标识
   */
  user: string
  /**
   * App 服务，用于实现应用列表的 CRUD 管理
   */
  appService?: DifyAppStore
}

const DEFAULT_CONTEXT_VALUE: IDifyChatContext = {
  user: '',
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