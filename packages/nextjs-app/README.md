# Dify Chat Web 的 Next.js 实现

完整使用文档详见：https://docs.dify-chat.lexmin.cn

## Why me?

通过服务端调用 Dify API，密钥信息不会在客户端传输和存储。

### 环境变量配置

生成 session 密钥：

```bash
openssl rand -base64 32
```

复制 .env.template 为 .env：

```bash
cp .env.template .env
```

修改密钥：

```bash
# .env
RUNNING_MODE=multiApp # 应用模式, 可选值：singleApp-单应用, multiApp-多应用
SESSION_SECRET=xxx # 上面生成的 Session 密钥
```

## 本地开发

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
