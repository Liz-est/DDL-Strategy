import { USER } from "./config";
import { DifyChatProvider } from "@dify-chat/core";
import { BrowserRouter, Route, type IRoute } from "pure-react-router";
import ChatPage from "./pages/chat";
import AppListPage from "./pages/app-list";

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