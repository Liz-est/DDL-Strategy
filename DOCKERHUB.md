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
