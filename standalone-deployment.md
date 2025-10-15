# Dify Chat 独立部署指南

本指南说明如何在不 clone 源码的情况下，直接使用 DockerHub 上的预构建镜像部署 Dify Chat。

## 快速开始

### 方式一：使用独立 Docker Compose 文件

1. **下载配置文件**

   ```bash
   # 下载独立部署配置文件
   curl -O https://raw.githubusercontent.com/lexmin0412/dify-chat/main/docker-compose.yml
   ```

2. **修改配置**

   ```bash
   # 编辑配置文件
   nano docker-compose.yml

   # 必须修改的配置：
   # - 配置 DATABASE_URL 为实际的数据库连接地址
   ```

3. **启动服务**

   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. **访问应用**
   - React App: http://localhost:5200
   - Platform API: http://localhost:5300

### 方式二：直接使用 Docker 命令

1. **启动 Platform 服务**

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

2. **启动 React App 服务**
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
| `PUBLIC_APP_API_BASE` | Platform 服务的客户端 API 地址 | `http://localhost:5300/api/client` | 是 |
| `PUBLIC_DIFY_PROXY_API_BASE` | Dify 代理 API 地址 | `http://localhost:5300/api/client/dify` | 是 |
| `PUBLIC_DEBUG_MODE` | 调试模式 | `false` | 否 |

### Platform 环境变量

| 变量名            | 描述              | 默认值                | 必填 |
| ----------------- | ----------------- | --------------------- | ---- |
| `NODE_ENV`        | 运行环境          | `production`          | 是   |
| `PORT`            | 服务端口          | `5300`                | 是   |
| `DATABASE_URL`    | 数据库连接地址    | -                     | 是   |
| `PRISMA_PROVIDER` | 数据库类型        | `postgresql`          | 是   |
| `JWT_SECRET`      | JWT 密钥          | -                     | 否   |
| `OPENAI_API_KEY`  | OpenAI API 密钥   | -                     | 否   |
| `DIFY_API_KEY`    | Dify API 密钥     | -                     | 否   |
| `DIFY_API_BASE`   | Dify API 基础地址 | `https://api.dify.ai` | 否   |
| `LOG_LEVEL`       | 日志级别          | `info`                | 否   |
| `CORS_ORIGINS`    | 允许的跨域来源    | -                     | 否   |

## 使用 .env 文件配置

如果你更喜欢使用 `.env` 文件管理环境变量：

1. **创建环境变量文件**

   ```bash
   # 创建 React App 环境变量文件
   cat > .env.react_app << EOF
   PUBLIC_APP_API_BASE=http://localhost:5300/api/client
   PUBLIC_DIFY_PROXY_API_BASE=http://localhost:5300/api/client/dify
   PUBLIC_DEBUG_MODE=false
   EOF

   # 创建 Platform 环境变量文件
   cat > .env.platform << EOF
   NODE_ENV=production
   PORT=5300
   DATABASE_URL=postgresql://username:password@host:port/database_name
   PRISMA_PROVIDER=postgresql
   EOF
   ```

2. **修改 docker-compose.standalone.yml**

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
   ```

## 数据库准备

在启动服务之前，请确保：

1. **数据库服务已启动**

   - PostgreSQL 或 MySQL 服务正在运行
   - 数据库和用户已创建
   - 网络连接正常

2. **数据库连接测试**

   ```bash
   # PostgreSQL 连接测试
   psql "postgresql://username:password@host:port/database_name" -c "SELECT 1;"

   # MySQL 连接测试
   mysql -h host -P port -u username -p database_name -e "SELECT 1;"
   ```

## 生产环境部署建议

1. **使用反向代理**

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

2. **使用 HTTPS**

   - 配置 SSL 证书
   - 更新环境变量中的 API 地址为 HTTPS

3. **数据备份**
   - 定期备份数据库
   - 备份重要配置文件

## 故障排除

### 常见问题

1. **服务无法启动**

   ```bash
   # 查看容器日志
   docker logs dify-chat-platform
   docker logs dify-chat-app-react

   # 检查端口占用
   netstat -tlnp | grep :5200
   netstat -tlnp | grep :5300
   ```

2. **数据库连接失败**

   ```bash
   # 检查数据库连接
   docker exec -it dify-chat-platform sh
   # 在容器内测试数据库连接
   ```

3. **API 请求失败**
   - 检查 `PUBLIC_APP_API_BASE` 配置是否正确
   - 确认 Platform 服务正常运行
   - 检查网络连接和防火墙设置

### 获取帮助

- 查看项目文档：[GitHub Repository](https://github.com/lexmin0412/dify-chat)
- 提交问题：[Issues](https://github.com/lexmin0412/dify-chat/issues)
- 社区讨论：[Discussions](https://github.com/lexmin0412/dify-chat/discussions)

## 版本更新

```bash
# 拉取最新镜像
docker pull lexmin0412/dify-chat-app-react:latest
docker pull lexmin0412/dify-chat-platform:latest

# 重启服务
docker-compose -f docker-compose.standalone.yml down
docker-compose -f docker-compose.standalone.yml up -d
```

## 许可证

本项目采用 [MIT License](https://github.com/lexmin0412/dify-chat/blob/main/LICENSE)。
