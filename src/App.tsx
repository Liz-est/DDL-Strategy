import { USER } from "./config";
import { DifyChatProvider } from "@dify-chat/core";
import { BrowserRouter, Route, type IRoute } from "pure-react-router";
import ChatPage from "./pages/chat";
import AppListPage from "./pages/app-list";
import { configResponsive } from "ahooks";

// 响应式配置, 供 useResponsive 使用，与 tailwindCSS 响应式配置保持一致
configResponsive({
  sm: 0,
  md: 768,
  lg: 1024,
});

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
      <DifyChatProvider value={{user: USER}}>
        <Route />
      </DifyChatProvider>
    </BrowserRouter>
  )
}