import { USER } from "./config";
import { DifyChatProvider } from "@dify-chat/core";
import DifyChatWrapper from "./wrapper";

/**
 * Dify Chat 的最小应用实例
 */
export default function App() {
  return (
    <DifyChatProvider value={{user: USER}}>
      <DifyChatWrapper />
    </DifyChatProvider>
  )
}