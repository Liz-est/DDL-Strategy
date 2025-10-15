# Dify Chat 容器化部署指南

本指南详细说明如何使用 Docker 和 Docker Compose 部署 Dify Chat 应用。

## 第三方开发者使用方式

Dify Chat 为第三方开发者提供两种使用方式：

### 方式一：独立部署（推荐）

**无需 clone 源码仓库**，直接使用 DockerHub 预构建镜像：

- 下载独立配置文件：`docker-compose.yml`
- 配置环境变量后直接启动
- 详细说明请参考：[独立部署指南](./standalone-deployment.md)

### 方式二：完整开发环境

**clone 源码仓库**，适合需要自定义开发的场景：

- 获取完整源码和开发工具
- 支持本地构建和调试
- 可以修改源码并重新构建镜像

---

## 完整开发环境部署

如果你需要完整的开发环境或想要自定义代码，请按照以下步骤操作：

## 部署方式

1. **使用 DockerHub 预构建镜像**（推荐）- 快速部署，无需构建
2. **本地构建镜像** - 适合开发和自定义需求

## 部署步骤

### 方式一：使用 DockerHub 预构建镜像

#### 1. 配置环境变量

#### React App 环境变量 (`.env.react_app`)

```bash
# React App API 配置
PUBLIC_APP_API_BASE=http://localhost:5300/api/client
PUBLIC_DIFY_PROXY_API_BASE=http://localhost:5300/api/client/dify
PUBLIC_DEBUG_MODE=false
```

#### Platform 环境变量 (`.env.platform`)

```bash
# 运行环境
NODE_ENV=production
PORT=5300

# 数据库配置 (请根据实际情况修改)
DATABASE_URL="postgresql://username:password@host:port/database"
PRISMA_PROVIDER=postgresql

# 其他配置
# 添加其他必要的环境变量...
```

#### 2. 使用 DockerHub 镜像启动服务

```bash
# 使用专用的 DockerHub 配置文件
docker-compose -f docker-compose.yml up -d

# 或者直接拉取镜像
docker pull yourusername/dify-chat-app-react:latest
docker pull yourusername/dify-chat-platform:latest
```

**注意**: 请将 `yourusername` 替换为实际的 DockerHub 用户名。

### 方式二：本地构建镜像

#### 1. 配置环境变量

环境变量配置与方式一相同，请参考上面的配置示例。

#### 2. 构建镜像

```bash
# 使用自动化构建脚本（推荐）
./scripts/docker-build.sh v1.0.0 yourusername

# 或者手动构建
docker build -f Dockerfile_react_app -t dify-chat-app-react:latest .
docker build -f Dockerfile_platform -t dify-chat-platform:latest .
```

#### 3. 启动服务

```bash
# 使用 docker-compose 启动所有服务
docker-compose up -d
```

## 镜像发布到 DockerHub

### 1. 构建和推送镜像

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

### 2. 安全注意事项

- ✅ 镜像中不包含任何敏感信息（API 密钥、数据库密码等）
- ✅ 环境变量通过 `.env` 文件在运行时注入
- ✅ 本地 `.env.react_app` 和 `.env.platform` 文件已被 `.dockerignore` 排除
- ✅ 所有敏感配置都通过环境变量动态设置

## 访问应用

- React App: http://localhost:5200
- Platform API: http://localhost:5300

## 文件说明

- `docker-compose.yml` - 完整开发环境配置，需要 clone 源码仓库
- `docker-compose.dockerhub.yml` - 使用 DockerHub 镜像的配置模板
- `docker-compose.standalone.yml` - 独立部署配置，无需 clone 源码
- `standalone-deployment.md` - 独立部署详细指南
- `scripts/docker-build.sh` - 镜像构建和推送脚本
- `.env.react_app.template` - React App 环境变量模板
- `.env.platform.template` - Platform 环境变量模板

## 注意事项

1. **环境变量配置**: 请确保 `.env.react_app` 和 `.env.platform` 文件已正确配置
2. **数据库连接**: Platform 服务需要连接到外部数据库，请在 `.env.platform` 中配置正确的 `DATABASE_URL`
3. **端口映射**: 默认端口为 5200 (React App) 和 5300 (Platform)，如需修改请同时更新 docker-compose.yml 和环境变量
4. **镜像更新**: 当代码更新时，需要重新构建镜像；但环境变量的修改无需重新构建
5. **安全性**: 镜像中不包含任何敏感信息，所有配置通过环境变量动态注入

## 故障排除

- 如果服务启动失败，请检查环境变量配置是否正确
- 确保数据库连接正常
- 检查端口是否被占用
- 查看容器日志: `docker-compose logs`
- 使用 DockerHub 镜像时，确保网络连接正常且镜像名称正确
