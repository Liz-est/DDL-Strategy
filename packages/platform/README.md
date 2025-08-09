# Dify Chat Admin - Next.js

Dify Chat 的管理后台，基于 Next.js 构建，使用 Prisma + SQLite 进行数据持久化。

默认账户/密码：admin@example.com / admin123

## 功能特性

- 🗄️ **数据库持久化**: 使用 Prisma ORM + SQLite 数据库
- 📊 **应用管理**: 完整的 Dify 应用配置管理
- 👥 **用户管理**: 支持多管理员账户管理
- 🎨 **现代化 UI**: 基于 Ant Design 的管理界面
- 🔒 **类型安全**: 完整的 TypeScript 支持
- 🌐 **客户端 API**: 为前端应用提供安全的 API 接口
- 🛡️ **API 代理**: 安全地代理 Dify API 请求，保护 API Key
- 🔐 **身份认证**: 基于 NextAuth.js 的安全认证系统

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

#### 方式一：一键初始化（推荐）

```bash
# 自动完成数据库初始化
pnpm db:init
```

这个命令会自动完成以下操作：

- 创建 `.env` 文件（如果不存在）
- 生成 Prisma 客户端
- 初始化数据库模式

#### 方式二：手动初始化

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 推送数据库模式（开发环境）
pnpm db:push

# 或者使用数据库迁移（生产环境推荐）
pnpm db:migrate
```

### 4. 管理员账户初始化

数据库初始化完成后，需要创建管理员账户：

```bash
# 创建默认管理员账户
pnpm create-admin
```

这将创建一个默认的管理员账户：

- **邮箱**: `admin@example.com`
- **密码**: `admin123`
- **姓名**: `系统管理员`

> ⚠️ **安全提示**: 首次登录后请立即修改默认密码！

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看管理后台。

## 数据库管理

### 数据库结构

当前系统包含以下数据表：

- **users** - 用户账户表

  - `id` - 用户唯一标识
  - `email` - 邮箱地址（唯一）
  - `password` - 加密密码
  - `name` - 用户姓名
  - `createdAt` / `updatedAt` - 时间戳

- **dify_apps** - Dify 应用配置表
  - `id` - 应用唯一标识
  - `name` - 应用名称
  - `mode` - 应用模式
  - `description` - 应用描述
  - `tags` - 应用标签
  - `isEnabled` - 是否启用
  - `apiBase` / `apiKey` - API 配置
  - `enableAnswerForm` - 是否启用答案表单
  - `inputParams` / `extConfig` - 扩展配置
  - `createdAt` / `updatedAt` - 时间戳

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

# 创建管理员账户
pnpm create-admin

# 一键初始化数据库
pnpm db:init
```

### 数据库文件位置

- **开发环境**: `prisma/dev.db`
- **生产环境**: 根据 `DATABASE_URL` 环境变量配置

### 备份与恢复

```bash
# 备份数据库
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# 恢复数据库
cp prisma/backup-20240101.db prisma/dev.db
```

## 项目结构

```
packages/platform/
├── prisma/                 # Prisma 配置和迁移
│   ├── schema.prisma      # 数据库模式
│   ├── migrations/        # 数据库迁移文件
│   └── dev.db            # SQLite 数据库文件
├── scripts/               # 工具脚本
│   ├── init-db.ts        # 数据库初始化脚本
│   └── create-admin.ts   # 管理员创建脚本
├── lib/
│   ├── prisma.ts         # Prisma 客户端
│   ├── auth.ts           # NextAuth 配置
│   └── db/               # 数据库工具
├── repository/
│   ├── app.ts            # 应用数据访问层
│   ├── user.ts           # 用户数据访问层
│   └── prisma/           # Prisma 实现
├── app/
│   ├── api/              # API 路由
│   │   ├── auth/         # 认证相关 API
│   │   ├── users/        # 用户管理 API
│   │   └── apps/         # 应用管理 API
│   ├── login/            # 登录页面
│   ├── app-management/   # 应用管理页面
│   ├── user-management/  # 用户管理页面
│   └── system-config/    # 系统配置页面
└── components/           # UI 组件
    ├── layout/           # 布局组件
    └── ui/               # 基础 UI 组件
```

## 数据库模式

### 核心数据表

#### users 表 - 用户账户管理

```sql
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

#### dify_apps 表 - Dify 应用配置

```sql
CREATE TABLE "dify_apps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "mode" TEXT,
    "description" TEXT,
    "tags" TEXT,
    "is_enabled" INTEGER DEFAULT 1,
    "api_base" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "enable_answer_form" BOOLEAN NOT NULL DEFAULT false,
    "answer_form_feedback_text" TEXT,
    "input_params" TEXT,
    "ext_config" TEXT
);
```

### 数据关系

- 系统采用简化的数据模型，专注于核心功能
- 用户表独立管理，支持多管理员
- 应用配置表存储 Dify 应用的完整配置信息
- 使用 JWT 进行会话管理，无需额外的会话表

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
