# 运行模式（单应用/多应用）

针对不同的应用场景，Dify Chat 提供 **单应用** 和 **多应用** 两种运行模式。

## 1. 单应用模式

如果你全局只需要一个 Dify 应用, 不想让用户手动修改，可以使用单应用模式。

![单应用模式](/sample_single-app-mode.png)

只需简单修改 `src/App.tsx` 中 `DifyChatProvider` 的属性即可：

```tsx
import { AppModeEnums } from "@dify-chat/core";

export default function App() {
  return (
    <DifyChatProvider
      value={{
        // 保留其他参数不变
        ...,
        // 修改为单应用模式
        mode: "singleApp",
        // 单应用模式下，需要传入 appConfig 配置
        appConfig: {
          requestConfig: {
            apiBase: "上一步中获取到的 API Base",
            apiKey: "上一步中获取到的 API Key",
          },
          // 如果你使用的是聊天类型应用 (Chatbot/Chatflow/Agent), 则不需要定义 info.mode
          info: {
            mode: AppModeEnums.WORKFLOW,
          },
        },
      }}
    >
      子组件
    </DifyChatProvider>
  );
}
```
