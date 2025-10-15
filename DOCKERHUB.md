# DockerHub 镜像发布指南

本文档说明如何将 Dify Chat 项目的 Docker 镜像发布到 DockerHub，供第三方开发者使用。

## 🔒 安全保障

在发布镜像之前，我们已经确保：

- ✅ **无敏感信息**: 镜像中不包含任何 API 密钥、数据库密码等敏感信息
- ✅ **环境变量隔离**: 所有配置通过运行时环境变量注入
- ✅ **文件排除**: `.dockerignore` 已配置排除本地环境变量文件
- ✅ **动态配置**: React App 的环境变量在容器启动时动态替换

## 📦 发布步骤

### 1. 准备工作

```bash
# 确保在项目根目录
cd /path/to/dify-chat

# 确保 Docker 已安装并运行
docker --version

# 登录 DockerHub
docker login
```

### 2. 构建和推送镜像

#### 方式一：使用自动化脚本（推荐）

```bash
# 构建并推送到 DockerHub
./scripts/docker-build.sh v1.0.0 yourusername

# 脚本会自动：
# 1. 构建两个镜像
# 2. 创建版本标签和 latest 标签
# 3. 询问是否推送到 DockerHub
# 4. 推送镜像并显示使用示例
```

#### 方式二：手动构建和推送

```bash
# 1. 构建镜像
docker build -f Dockerfile_react_app -t dify-chat-app-react:v1.0.0 .
docker build -f Dockerfile_platform -t dify-chat-platform:v1.0.0 .

# 2. 创建 DockerHub 标签
docker tag dify-chat-app-react:v1.0.0 yourusername/dify-chat-app-react:v1.0.0
docker tag dify-chat-app-react:v1.0.0 yourusername/dify-chat-app-react:latest
docker tag dify-chat-platform:v1.0.0 yourusername/dify-chat-platform:v1.0.0
docker tag dify-chat-platform:v1.0.0 yourusername/dify-chat-platform:latest

# 3. 推送镜像
docker push yourusername/dify-chat-app-react:v1.0.0
docker push yourusername/dify-chat-app-react:latest
docker push yourusername/dify-chat-platform:v1.0.0
docker push yourusername/dify-chat-platform:latest
```

### 3. 验证发布

```bash
# 验证镜像已成功推送
docker pull yourusername/dify-chat-app-react:latest
docker pull yourusername/dify-chat-platform:latest

# 测试镜像运行
docker run --rm -p 5200:80 yourusername/dify-chat-app-react:latest
```

## 📋 版本管理

### 版本号规范

建议使用语义化版本号：

- `v1.0.0` - 主要版本
- `v1.1.0` - 功能更新
- `v1.1.1` - 问题修复

### 标签策略

每次发布都会创建两个标签：

- 具体版本标签：`yourusername/dify-chat-app-react:v1.0.0`
- 最新版本标签：`yourusername/dify-chat-app-react:latest`

## 🚀 第三方开发者使用指南

### 快速开始（无需 clone 源码）

第三方开发者可以直接使用 DockerHub 镜像，无需 clone 源码仓库：

1. **下载独立配置文件**

   ```bash
   curl -O https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/dify-chat/main/docker-compose.standalone.yml
   ```

2. **下载环境变量模板**

   ```bash
   curl -O https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/dify-chat/main/.env.react_app.template
   curl -O https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/dify-chat/main/.env.platform.template
   ```

3. **配置环境变量**

   ```bash
   # 复制模板文件
   cp .env.react_app.template .env.react_app
   cp .env.platform.template .env.platform

   # 编辑配置文件
   nano .env.react_app
   nano .env.platform
   ```

4. **启动服务**
   ```bash
   docker-compose -f docker-compose.standalone.yml up -d
   ```

详细的独立部署指南请参考：[standalone-deployment.md](./standalone-deployment.md)

### 完整开发环境

如果需要完整的开发环境或自定义代码：

1. **拉取镜像**

```bash
docker pull yourusername/dify-chat-app-react:latest
docker pull yourusername/dify-chat-platform:latest
```

2. **配置环境变量**

```bash
# 创建 .env.react_app
cat > .env.react_app << EOF
PUBLIC_APP_API_BASE=http://localhost:5300/api/client
PUBLIC_DIFY_PROXY_API_BASE=http://localhost:5300/api/client/dify
PUBLIC_DEBUG_MODE=false
EOF

# 创建 .env.platform
cat > .env.platform << EOF
NODE_ENV=production
PORT=5300
DATABASE_URL="postgresql://username:password@host:port/database"
PRISMA_PROVIDER=postgresql
EOF
```

3. **使用 Docker Compose 启动**

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/yourusername/dify-chat/main/docker-compose.dockerhub.yml

# 修改配置文件中的镜像名称
sed -i 's/yourusername/your-actual-username/g' docker-compose.dockerhub.yml

# 启动服务
docker-compose -f docker-compose.dockerhub.yml up -d
```

### 自定义配置

开发者可以通过修改环境变量文件来自定义配置，无需重新构建镜像：

- **API 端点配置**: 修改 `.env.react_app` 中的 API 地址
- **数据库配置**: 修改 `.env.platform` 中的数据库连接
- **端口配置**: 修改 docker-compose 文件中的端口映射

## 🔧 维护和更新

### 定期更新

1. **代码更新后重新构建**

```bash
./scripts/docker-build.sh v1.1.0 yourusername
```

2. **安全更新**

- 定期更新基础镜像
- 检查依赖包安全漏洞
- 更新 Node.js 版本

### 镜像清理

```bash
# 清理本地旧版本镜像
docker image prune -f

# 删除特定版本
docker rmi yourusername/dify-chat-app-react:v1.0.0
```

## 📚 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南
- [docker-compose.dockerhub.yml](./docker-compose.dockerhub.yml) - DockerHub 镜像配置
- [scripts/docker-build.sh](./scripts/docker-build.sh) - 自动化构建脚本

## ❓ 常见问题

**Q: 如何确保镜像中没有敏感信息？** A: 我们使用 `.dockerignore` 排除所有环境变量文件，并且在 Dockerfile 中只设置默认值，真实配置通过运行时环境变量注入。

**Q: 如何更新镜像版本？** A: 使用 `./scripts/docker-build.sh` 脚本，指定新的版本号即可自动构建和推送。

**Q: 第三方开发者如何获取最新版本？** A: 使用 `docker pull yourusername/dify-chat-app-react:latest` 即可获取最新版本。
