import { USER } from "./config";
import { DifyChatProvider } from "@dify-chat/core";
import { BrowserRouter, Route, type IRoute } from "pure-react-router";
import ChatPage from "./pages/chat";
import AppListPage from "./pages/app-list";
import { initResponsiveConfig } from "@dify-chat/helpers";
import DifyAppService from "./services/app/localstorage";

// 初始化响应式配置
initResponsiveConfig()

const routes: IRoute[] = [
  { path: "/chat", component: ()  => <ChatPage /> },
  { path: "/apps", component: () => <AppListPage /> },
  { path: "/", component: ()  => <ChatPage /> },
];

/**
 * Dify Chat 的最小应用实例
 */
export default function App() {
  return (
    <BrowserRouter basename="/dify-chat" routes={routes}>
      <DifyChatProvider value={{
        mode: 'multiApp',
        user: USER,
        // 默认使用 localstorage, 如果需要使用其他存储方式，可以实现 DifyAppStore 接口后传入，异步接口实现参考 src/services/app/restful.ts
        appService: new DifyAppService(),
      }}>
        <Route />
      </DifyChatProvider>
    </BrowserRouter>
  )
}