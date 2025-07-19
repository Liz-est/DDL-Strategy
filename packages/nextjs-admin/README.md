# Dify Chat Admin - Next.js

Dify Chat 的管理后台，基于 Next.js 构建，使用 Prisma + SQLite 进行数据持久化。

## 功能特性

- 🗄️ **数据库持久化**: 使用 Prisma ORM + SQLite 数据库
- 📊 **应用管理**: 完整的 Dify 应用配置管理
- 🎨 **现代化 UI**: 基于 Ant Design 的管理界面
- 🔒 **类型安全**: 完整的 TypeScript 支持
- 🌐 **客户端 API**: 为前端应用提供安全的 API 接口
- 🛡️ **API 代理**: 安全地代理 Dify API 请求，保护 API Key

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 环境配置

复制环境变量配置文件：

```bash
cp .env.example .env
```

### 3. 数据库初始化

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送数据库模式（开发环境）
pnpm db:push

# 或者使用数据库迁移（生产环境推荐）
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看管理后台。

## 数据库管理

### 常用命令

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送模式到数据库（开发环境）
pnpm db:push

# 创建和运行迁移（生产环境）
pnpm db:migrate

# 打开数据库管理界面
pnpm db:studio

# 运行种子数据
pnpm db:seed
```

## 项目结构

```
packages/nextjs-admin/
├── prisma/                 # Prisma 配置和迁移
│   ├── schema.prisma      # 数据库模式
│   ├── migrations/        # 数据库迁移文件
│   └── seed.ts           # 种子数据
├── lib/
│   ├── prisma.ts         # Prisma 客户端
│   └── db/               # 数据库工具
├── repository/
│   ├── app.ts            # 应用数据访问层
│   └── prisma/           # Prisma 实现
├── app/
│   ├── app-management/   # 应用管理页面
│   └── system-config/    # 系统配置页面
└── components/           # UI 组件
```

## 数据库模式

应用配置存储在 `dify_apps` 表中，包含以下字段：

- 基本信息：name, mode, description, tags
- 请求配置：apiBase, apiKey
- 功能配置：answerForm, inputParams, extConfig
- 时间戳：createdAt, updatedAt

## 部署

### 开发环境

```bash
pnpm dev
```

### 生产环境

```bash
# 构建应用
pnpm build

# 时间戳：createdAt, updatedAt启动生产服务器
pnpm start
```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN pnpm install
RUN pnpm db:generate
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## 环境变量

| 变量名         | 描述             | 默认值          |
| -------------- | ---------------- | --------------- |
| `DATABASE_URL` | 数据库连接字符串 | `file:./dev.db` |

## 技术栈

- **框架**: Next.js 15 + React 19
- **数据库**: SQLite + Prisma ORM
- **UI**: Ant Design + Tailwind CSS
- **语言**: TypeScript
- **构建**: Turbopack

## 贡献

欢迎提交 Issue 和 Pull Request！
