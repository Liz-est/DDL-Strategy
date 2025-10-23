# Dify Chat 容器化部署指南

本指南详细说明如何使用 Docker 和 Docker Compose 部署 Dify Chat 应用。

## 开发者使用方式

Dify Chat 提供两种使用方式：

### 方式一：独立部署（推荐）

无需 clone 源码，直接使用 DockerHub 预构建镜像：

- 下载独立配置文件：`docker-compose.yml`
- 配置环境变量后直接启动
- 也可使用纯 Docker 命令启动

### 方式二：完整开发环境

clone 源码仓库，适合需要自定义开发：

- 获取完整源码和开发工具
- 支持本地构建和调试
- 可以修改源码并重新构建镜像

---

## 独立部署（无需源码）

### 方式一：使用独立 Docker Compose 文件

1. 下载配置文件

```bash
curl -O https://raw.githubusercontent.com/lexmin0412/dify-chat/main/docker-compose.yml
```

2. 修改配置

```bash
# 编辑配置文件
nano docker-compose.yml

# 必须修改的配置：
# - 配置 DATABASE_URL 为实际的数据库连接地址
```

3. 启动服务

```bash
docker-compose -f docker-compose.yml up -d
```

4. 访问应用

- React App: http://localhost:5200
- Platform API: http://localhost:5300

### 方式二：直接使用 Docker 命令

1. 启动 Platform 服务

```bash
docker run -d \
  --name dify-chat-platform \
  -p 5300:5300 \
  -e NODE_ENV=production \
  -e PORT=5300 \
  -e DATABASE_URL="postgresql://username:password@host:port/database_name" \
  -e PRISMA_PROVIDER=postgresql \
  lexmin0412/dify-chat-platform:latest
```

2. 启动 React App 服务

```bash
docker run -d \
  --name dify-chat-app-react \
  -p 5200:80 \
  -e PUBLIC_APP_API_BASE="http://localhost:5300/api/client" \
  -e PUBLIC_DIFY_PROXY_API_BASE="http://localhost:5300/api/client/dify" \
  -e PUBLIC_DEBUG_MODE="false" \
  lexmin0412/dify-chat-app-react:latest
```

## 环境变量配置

### React App 环境变量

| 变量名 | 描述 | 默认值 | 必填 |
| --- | --- | --- | --- |
| `PUBLIC_APP_API_BASE` | Platform 客户端 API 地址 | `http://localhost:5300/api/client` | 是 |
| `PUBLIC_DIFY_PROXY_API_BASE` | Dify 代理 API 地址 | `http://localhost:5300/api/client/dify` | 是 |
| `PUBLIC_DEBUG_MODE` | 调试模式 | `false` | 否 |

### Platform 环境变量

| 变量名            | 描述           | 默认值 | 必填 |
| ----------------- | -------------- | ------ | ---- |
| `DATABASE_URL`    | 数据库连接地址 | -      | 是   |
| `NEXTAUTH_SECRET` | NextAuth 密钥  | -      | 是   |

## 使用 .env 文件配置

如果你更喜欢使用 `.env` 文件管理环境变量：

1. 创建环境变量文件

# Platform 环境变量文件

cat > .env.platform << EOF NODE_ENV=production PORT=5300 DATABASE_URL=postgresql://username:password@host:port/database_name PRISMA_PROVIDER=postgresql EOF

````

2. 在 docker-compose.yml 中引用

```yaml
services:
  react-app:
    # ... 其他配置
    env_file:
      - .env.react_app
    # 注释掉 environment 部分

  platform:
    # ... 其他配置
    env_file:
      - .env.platform
    # 注释掉 environment 部分
````

## 完整开发环境部署

如果你需要完整的开发环境或想要自定义代码，请按照以下步骤操作：

### 部署方式

1. 使用 DockerHub 预构建镜像（推荐）- 快速部署，无需构建
2. 本地构建镜像 - 适合开发和自定义需求

### 构建与启动

1. 配置环境变量（参考上面的示例）

2. 构建镜像

```bash
# 使用自动化构建脚本（推荐）
./scripts/docker-build.sh v1.0.0 yourusername

# 或者手动构建
docker build -f Dockerfile_react_app -t dify-chat-app-react:latest .
docker build -f Dockerfile_platform -t dify-chat-platform:latest .
```

3. 启动服务

```bash
# 使用 docker-compose 启动所有服务
docker-compose up -d
```

## 镜像发布到 DockerHub

### 构建和推送镜像

```bash
# 使用自动化脚本构建并推送
./scripts/docker-build.sh v1.0.0 yourusername

# 或者手动推送
docker login
docker tag dify-chat-app-react:latest yourusername/dify-chat-app-react:latest
docker tag dify-chat-platform:latest yourusername/dify-chat-platform:latest
docker push yourusername/dify-chat-app-react:latest
docker push yourusername/dify-chat-platform:latest
```

### 安全注意事项

- 镜像中不包含敏感信息（API 密钥、数据库密码等）
- 环境变量通过 `.env` 文件在运行时注入
- 本地 `.env.react_app` 和 `.env.platform` 文件已被 `.dockerignore` 排除
- 所有敏感配置都通过环境变量动态设置

## 数据库准备

在启动服务之前，请确保：

1. 数据库服务已启动

   - PostgreSQL 或 MySQL 服务正在运行
   - 数据库和用户已创建
   - 网络连接正常

2. 数据库连接测试

```bash
# PostgreSQL 连接测试
psql "postgresql://username:password@host:port/database_name" -c "SELECT 1;"

# MySQL 连接测试
mysql -h host -P port -u username -p database_name -e "SELECT 1;"
```

## 生产环境部署建议

1. 使用反向代理

```nginx
# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:5300;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. 使用 HTTPS

- 配置 SSL 证书
- 更新环境变量中的 API 地址为 HTTPS

3. 数据备份

- 定期备份数据库
- 备份重要配置文件

## 故障排除

### 常见问题与排查

1. 服务无法启动

```bash
# 查看容器日志
docker logs dify-chat-platform
docker logs dify-chat-app-react

# 检查端口占用
netstat -tlnp | grep :5200
netstat -tlnp | grep :5300
```

2. 数据库连接失败

```bash
# 检查数据库连接
docker exec -it dify-chat-platform sh
# 在容器内测试数据库连接
```

3. API 请求失败

- 检查 `PUBLIC_APP_API_BASE` 配置是否正确
- 确认 Platform 服务正常运行
- 检查网络连接和防火墙设置

## 访问应用

- React App: http://localhost:5200
- Platform API: http://localhost:5300

## 版本更新

```bash
# 拉取最新镜像
docker pull lexmin0412/dify-chat-app-react:latest
docker pull lexmin0412/dify-chat-platform:latest

# 重启服务
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml up -d
```

## 文件说明

- `docker-compose.yml` - 完整开发环境与独立部署通用配置
- `docker-compose.dev.yml` - 本地开发环境配置
- `scripts/docker-build.sh` - 镜像构建和推送脚本
- `.env.react_app.template` - React App 环境变量模板
- `.env.platform.template` - Platform 环境变量模板

## 许可证

本项目采用 [MIT License](https://github.com/lexmin0412/dify-chat/blob/main/LICENSE)。
