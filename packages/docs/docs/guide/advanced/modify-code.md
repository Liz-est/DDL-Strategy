# 按需修改代码

我们提供了 React SPA 和 Next.js 两种技术实现，下面的内容将会分两种技术栈进行讲解，你可以按照你的喜好进行选择阅读。

## React SPA

> 注意：为行文简洁，本小节下所有的路径表示省略 `packages/react-app` 前缀, 如 `src/App.tsx`, 实际路径为 `packages/react-app/src/App.tsx`。

### 0. 选定运行模式

在上一节 [选择适合你的模式](./select-mode.md) 中，我们已经选定了应用模式。

默认情况下，代码中的运行模式为 "多应用"，你可以在 `src/App.tsx` 中，看到初始化全局运行时配置的代码：

```tsx
// 初始化全局运行时配置
difyChatRuntimeConfig.init('multiApp');
```

如果你想要以单应用模式运行，需要对 `difyChatRuntimeConfig.init()` 的参数进行修改：

```tsx
// 初始化全局运行时配置
difyChatRuntimeConfig.init('singleApp');
```

### 1. 确定存储方式

默认情况下，为方便演示，我们使用 LocalStorage 进行应用配置的存储。你可以在 `src/services/app` 中看到：

多应用模式：

```tsx
// src/services/app/multiApp/index.ts
import DifyAppService from './localstorage';

export const appService = new DifyAppService();
```

单应用模式：

```tsx
// src/services/app/singleApp/index.ts
export { appConfig } from './localstorage';
```

在 `src/services/app` 在，分别有 `multiApp` 和 `singleApp` 两个目录，其下又分别有三种应用配置存储的实现形式：

- `static-readonly`，写死在代码中的数据，只读
- `localstorage`, 使用 LocalStorage 存储，可读写，但无法跨浏览器同步
- `restful`，通过 API 接口存储，可读写，可同步，推荐使用🌟

你可以根据你的需要自行选择，也可以修改代码或扩展其他实现形式，最终只要通过 `src/services/app/multiApp/index.ts` 或者 `src/services/app/singleApp/index.ts` 导出即可。

## Next.js

TODO: 待完善。
