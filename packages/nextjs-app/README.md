# Dify Chat Web 的 Next.js 实现【WIP】

> 注意：当前 package 仍在开发中，暂不可用，敬请期待。

## Why me?

- 通过服务端调用 Dify API，密钥信息不会暴露在客户端
- 应用列表 CRUD 默认实现调整为服务端存储，跨客户端不丢失，真正实现开箱即用

## 本地开发

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Roadmap

- [x] 把 react-app 以及其他子包的依赖升级到 react 19
- [ ] 子包依赖本地开发热更新
