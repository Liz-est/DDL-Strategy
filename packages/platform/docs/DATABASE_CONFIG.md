# 数据库配置指南

本文档详细说明了不同环境下的 SQLite 数据库配置方案。

## 🔧 环境变量配置

### DATABASE_URL 格式

SQLite 数据库 URL 格式：`file:<path>`

```bash
# 相对路径（推荐用于开发环境）
DATABASE_URL="file:./prisma/dev.db"

# 绝对路径（推荐用于生产环境）
DATABASE_URL="file:/app/data/prod.db"
```

## 🏠 开发环境

### 配置文件：`.env`

```bash
# 开发环境配置
DATABASE_URL="file:./prisma/dev.db"
```

### 特点

- ✅ 数据库文件存储在项目的 `prisma/` 目录下
- ✅ 便于开发调试和数据查看
- ✅ 支持 Prisma Studio 可视化管理

### 数据库文件位置

```
packages/nextjs-admin/
├── prisma/
│   ├── dev.db          # 开发环境数据库文件
│   ├── dev.db-journal  # SQLite 日志文件
│   └── schema.prisma
```

## 🚀 生产环境

### 方式一：直接部署

```bash
# 生产环境变量
export DATABASE_URL="file:/var/lib/dify-chat/prod.db"
export NODE_ENV="production"

# 确保数据目录存在
mkdir -p /var/lib/dify-chat
chmod 755 /var/lib/dify-chat

# 启动应用
pnpm build && pnpm start
```

### 方式二：Docker 部署

#### Dockerfile 配置

```dockerfile
# 数据库路径配置
ENV DATABASE_URL="file:/app/data/prod.db"
ENV NODE_ENV="production"

# 创建数据目录
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
```

#### Docker Compose 配置

```yaml
services:
  dify-chat-admin:
    environment:
      - DATABASE_URL=file:/app/data/prod.db
    volumes:
      - ./data:/app/data # 数据持久化
```

### 数据库文件位置

```
/app/data/
├── prod.db          # 生产环境数据库文件
└── prod.db-journal  # SQLite 日志文件
```

## 🔄 环境切换

### 开发 → 生产

```bash
# 1. 备份开发数据库
cp prisma/dev.db backup/dev-$(date +%Y%m%d).db

# 2. 设置生产环境变量
export DATABASE_URL="file:/app/data/prod.db"
export NODE_ENV="production"

# 3. 初始化数据库结构
npx prisma db push

# 4. 启动生产服务
pnpm build && pnpm start
```

### 生产 → 开发

```bash
# 1. 重置为开发环境变量
export DATABASE_URL="file:./prisma/dev.db"
export NODE_ENV="development"

# 2. 重新生成 Prisma 客户端
pnpm db:generate

# 3. 启动开发服务
pnpm dev
```

## 📊 数据库管理

### 开发环境

```bash
# 可视化管理界面
pnpm db:studio

# 查看数据库文件
ls -la prisma/dev.db*

# 备份数据库
cp prisma/dev.db backups/dev-backup.db
```

### 生产环境

```bash
# 连接到生产数据库
sqlite3 /app/data/prod.db

# 备份生产数据库
cp /app/data/prod.db /backup/prod-$(date +%Y%m%d-%H%M%S).db

# 查看数据库大小
du -h /app/data/prod.db
```

## 🔒 安全配置

### 文件权限

```bash
# 开发环境
chmod 644 prisma/dev.db

# 生产环境
chmod 600 /app/data/prod.db
chown app:app /app/data/prod.db
```

### 环境变量安全

```bash
# ❌ 不要在代码中硬编码
DATABASE_URL="file:./hardcoded.db"

# ✅ 使用环境变量
DATABASE_URL="${DATABASE_URL}"

# ✅ 使用 .env 文件（不提交到版本控制）
echo "DATABASE_URL=file:./prisma/dev.db" > .env
```

## 🚨 故障排除

### 常见问题

#### 1. 数据库文件权限错误

```bash
Error: SQLITE_CANTOPEN: unable to open database file
```

**解决方案：**

```bash
# 检查文件权限
ls -la prisma/dev.db

# 修复权限
chmod 644 prisma/dev.db
```

#### 2. 数据库目录不存在

```bash
Error: SQLITE_CANTOPEN: unable to open database file
```

**解决方案：**

```bash
# 创建目录
mkdir -p prisma
mkdir -p /app/data  # 生产环境
```

#### 3. 环境变量未设置

```bash
Error: Environment variable not found: DATABASE_URL
```

**解决方案：**

```bash
# 检查环境变量
echo $DATABASE_URL

# 设置环境变量
export DATABASE_URL="file:./prisma/dev.db"

# 或创建 .env 文件
echo "DATABASE_URL=file:./prisma/dev.db" > .env
```

### 数据库诊断

```bash
# 检查数据库连接
npx prisma db execute --stdin <<< "SELECT 1;"

# 查看数据库信息
npx prisma db execute --stdin <<< ".schema"

# 检查表结构
npx prisma db execute --stdin <<< ".tables"
```

## 📈 性能优化

### SQLite 配置优化

```sql
-- 启用 WAL 模式（提高并发性能）
PRAGMA journal_mode=WAL;

-- 设置缓存大小（提高查询性能）
PRAGMA cache_size=10000;

-- 启用外键约束
PRAGMA foreign_keys=ON;
```

### 数据库维护

```bash
# 数据库优化
sqlite3 /app/data/prod.db "VACUUM;"

# 分析查询性能
sqlite3 /app/data/prod.db "ANALYZE;"

# 检查数据库完整性
sqlite3 /app/data/prod.db "PRAGMA integrity_check;"
```

## 🔄 备份策略

### 自动备份脚本

```bash
#!/bin/bash
# backup-db.sh

DB_PATH="/app/data/prod.db"
BACKUP_DIR="/backup/dify-chat"
DATE=$(date +%Y%m%d-%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp $DB_PATH $BACKUP_DIR/prod-$DATE.db

# 保留最近 7 天的备份
find $BACKUP_DIR -name "prod-*.db" -mtime +7 -delete

echo "数据库备份完成: $BACKUP_DIR/prod-$DATE.db"
```

### 定时备份（crontab）

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-db.sh
```

## 📋 配置检查清单

### 开发环境

- [ ] `.env` 文件已创建
- [ ] `DATABASE_URL` 指向开发数据库
- [ ] `prisma/` 目录存在且可写
- [ ] Prisma 客户端已生成

### 生产环境

- [ ] 生产环境变量已设置
- [ ] 数据库目录存在且有正确权限
- [ ] 数据库文件已备份
- [ ] 健康检查正常工作

### Docker 部署

- [ ] 数据卷已挂载
- [ ] 环境变量已配置
- [ ] 容器有数据库文件写权限
- [ ] 健康检查配置正确

---

通过正确配置数据库环境变量，你可以确保应用在不同环境下都能正常工作，并且数据安全可靠！
