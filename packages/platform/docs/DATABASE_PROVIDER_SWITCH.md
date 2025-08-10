# 数据库 Provider 动态切换指南

## 🔄 概述

虽然 Prisma schema 中的 `provider` 字段不能直接使用环境变量 <mcreference link="https://github.com/prisma/prisma/issues/1487" index="2">2</mcreference>，但我们提供了一套完整的解决方案来实现不同环境下的数据库动态切换。

## ❌ 不支持的方式

```prisma
datasource db {
  provider = env("DATABASE_PROVIDER")  // ❌ Prisma 不支持这种方式
  url      = env("DATABASE_URL")
}
```

## ✅ 支持的解决方案

### 方案一：使用切换脚本（推荐）

我们提供了自动化脚本来切换不同的数据库配置：

```bash
# 切换到 SQLite
pnpm db:switch:sqlite

# 切换到 PostgreSQL
pnpm db:switch:postgresql

# 或者直接使用脚本
pnpm db:switch sqlite
pnpm db:switch postgresql
```

### 方案二：手动切换模板文件

项目中包含了多个预配置的模板文件：

- `prisma/schema.prisma` - 主配置文件
- `prisma/templates/schema.sqlite.template` - SQLite 模板
- `prisma/templates/schema.postgresql.template` - PostgreSQL 模板

手动复制对应的模板到主配置：

```bash
# 切换到 SQLite
cp prisma/templates/schema.sqlite.template prisma/schema.prisma

# 切换到 PostgreSQL
cp prisma/templates/schema.postgresql.template prisma/schema.prisma
```

### 方案三：程序化覆盖数据库 URL

在代码中动态设置数据库连接 <mcreference link="https://spin.atomicobject.com/environment-database-prisma/" index="4">4</mcreference>：

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

**注意：** 这种方式只能覆盖 URL，不能改变 provider 类型。

## 🛠️ 使用步骤

### 1. 选择数据库类型

根据环境选择合适的数据库：

- **开发环境**: SQLite（轻量、无需额外配置）
- **生产环境**: PostgreSQL（性能更好、功能更全）

### 2. 设置环境变量

创建或修改 `.env` 文件：

```bash
# SQLite 配置
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL 配置
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 3. 切换数据库配置

```bash
# 切换到目标数据库
pnpm db:switch:sqlite
# 或
pnpm db:switch:postgresql
```

### 4. 生成客户端和同步数据库

```bash
# 重新生成 Prisma 客户端
pnpm db:generate

# 同步数据库结构
pnpm db:push
```

## 📋 环境配置示例

### 开发环境 (.env.local)

```bash
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
```

### 生产环境

```bash
DATABASE_URL="postgresql://prod_user:prod_pass@db.example.com:5432/prod_db"
NODE_ENV="production"
```

### Docker 环境

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/dify_chat

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=dify_chat
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
```

## 🔧 自动化脚本功能

我们的 `scripts/switch-db.ts` 脚本提供以下功能：

1. **自动备份**: 切换前自动备份当前配置
2. **验证文件**: 检查目标配置文件是否存在
3. **智能提示**: 显示对应的环境变量配置
4. **操作指导**: 提供后续操作步骤

### 脚本使用示例

```bash
$ pnpm db:switch sqlite

🔄 切换到 SQLite 数据库...
📦 已备份当前 schema 到: schema.prisma.backup.1703123456789
✅ 已切换到 sqlite 数据库配置

📝 请确保设置正确的环境变量:
   DATABASE_URL="file:./prisma/dev.db"

🔧 接下来的步骤:
   1. 检查 .env 文件中的 DATABASE_URL
   2. 运行: pnpm db:generate
   3. 运行: pnpm db:push (或 pnpm db:migrate)
```

## 🚨 注意事项

1. **数据迁移**: 切换数据库类型时，需要手动迁移数据
2. **类型兼容性**: 不同数据库的数据类型可能不完全兼容
3. **备份重要**: 切换前务必备份重要数据
4. **环境一致性**: 确保团队成员使用相同的数据库配置

## 🔍 故障排除

### 问题：切换后 Prisma 客户端报错

```bash
# 解决方案：重新生成客户端
pnpm db:generate
```

### 问题：数据库连接失败

```bash
# 检查环境变量
echo $DATABASE_URL

# 检查数据库服务状态（PostgreSQL）
pg_isready -h localhost -p 5432
```

### 问题：Schema 文件不存在

```bash
# 重新创建配置文件
pnpm db:switch sqlite
```

## 📚 相关资源

- <mcreference link="https://www.prisma.io/docs/orm/more/development-environment/environment-variables" index="1">Prisma 环境变量文档</mcreference>
- <mcreference link="https://www.prisma.io/docs/orm/prisma-schema/overview/data-sources" index="5">Prisma 数据源配置</mcreference>
- <mcreference link="https://github.com/prisma/prisma/issues/1487" index="2">Prisma 动态 Provider 讨论</mcreference>
