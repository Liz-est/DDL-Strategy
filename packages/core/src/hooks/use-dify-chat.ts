import React, { useContext } from "react";
import { DifyAppStore, IDifyAppItem } from "../storage";

export type IDifyChatMode = 'singleApp' | 'multiApp'

interface IDifyChatContextBase {
  /**
   * 当前用户
   */
  user: string
}

/**
 * 单应用模式下的上下文
 */
export interface IDifyChatContextSingleApp extends IDifyChatContextBase {
  /**
   * 交互模式 - 单应用
   */
  mode: 'singleApp'
  /**
   * 当前应用 ID
   */
  appConfig: IDifyAppItem['requestConfig']
}

/**
 * 多应用模式下的上下文
 */
export interface IDifyChatContextMultiApp extends IDifyChatContextBase {
  /**
   * 交互模式 - 多应用
   */
  mode: 'multiApp'
  /**
   * 应用服务，用于实现应用列表的 CRUD 管理
   */
  appService: DifyAppStore
}

/**
 * DifyChat 上下文类型
 */
type IDifyChatContext = IDifyChatContextSingleApp | IDifyChatContextMultiApp

const DEFAULT_CONTEXT_VALUE: IDifyChatContext = {
  mode: 'multiApp',
  user: '',
  // 修正为符合 DifyAppStore 类型的初始值，这里假设可以使用一个空对象作为初始值
  appService: {} as DifyAppStore,
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