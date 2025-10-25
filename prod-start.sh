#!/bin/bash

# Determine the correct sed -i syntax based on OS
if [[ "$(uname)" == "Darwin" ]]; then
  # macOS (BSD sed)
  SED_INPLACE="sed -i ''"
else
  # Linux (GNU sed)
  SED_INPLACE="sed -i"
fi

# 生产环境启动脚本
# 使用 PM2 管理 Platform 服务，构建 React App 静态文件

set -e

echo "🚀 启动 Dify Chat 生产环境..."

# 检查必要工具
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，正在安装..."
    npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 构建基础包
echo "🔨 构建基础包..."
pnpm build:pkgs

# 构建 React App
echo "🏗️ 构建 React App..."
cd packages/react-app

# 检查 React App 环境配置文件
if [ ! -f .env ]; then
    echo "创建 React App 环境配置文件..."
    cat > .env << EOF
# 应用配置 API 基础路径
PUBLIC_APP_API_BASE=http://localhost:5300/api/client
# Dify 代理 API 基础路径
PUBLIC_DIFY_PROXY_API_BASE=http://localhost:5300/api/client/dify
EOF
    echo "✅ 已创建 React App .env 配置文件"
else
    echo "📝 React App .env 配置文件已存在"
    # 检查必要的环境变量
    if ! grep -q "^PUBLIC_APP_API_BASE=" .env; then
        echo "添加 PUBLIC_APP_API_BASE 配置..."
        echo "PUBLIC_APP_API_BASE=http://localhost:5300/api/client" >> .env
    fi

    if ! grep -q "^PUBLIC_DIFY_PROXY_API_BASE=" .env; then
        echo "添加 PUBLIC_DIFY_PROXY_API_BASE 配置..."
        echo "PUBLIC_DIFY_PROXY_API_BASE=http://localhost:5300/api/client/dify" >> .env
    fi
fi

pnpm build

echo "🔄 替换 React App 环境变量..."

# Load environment variables from .env
if [ -f .env ]; then
  source .env
else
  echo "⚠️ .env file not found in packages/react-app. Using default values for replacement."
fi

# Ensure variables are set, using defaults if not present in .env or environment
PUBLIC_APP_API_BASE=${PUBLIC_APP_API_BASE:-"http://localhost:5300/api/client"}
PUBLIC_DIFY_PROXY_API_BASE=${PUBLIC_DIFY_PROXY_API_BASE:-"http://localhost:5300/api/client/dify"}
PUBLIC_DEBUG_MODE=${PUBLIC_DEBUG_MODE:-"false"}

# Perform replacements in dist/env.js
${SED_INPLACE} "s|{{__PUBLIC_APP_API_BASE__}}|$PUBLIC_APP_API_BASE|g" dist/env.js
${SED_INPLACE} "s|{{__PUBLIC_DIFY_PROXY_API_BASE__}}|$PUBLIC_DIFY_PROXY_API_BASE|g" dist/env.js
${SED_INPLACE} "s|{{__PUBLIC_DEBUG_MODE__}}|$PUBLIC_DEBUG_MODE|g" dist/env.js

echo "✅ React App 环境变量替换完成"

echo "✅ React App 构建完成，静态文件位于: packages/react-app/dist"
cd ../..

# 配置 Platform 环境
echo "⚙️ 配置 Platform 环境..."
cd packages/platform

# 检查生产环境配置文件
if [ ! -f .env ]; then
    echo "创建 Platform 生产环境配置文件..."
    touch .env
fi

# 检查必要的环境变量
if ! grep -q "^DATABASE_URL=" .env; then
    echo "添加 DATABASE_URL 配置..."
    echo "# Database - 生产环境请使用 PostgreSQL 或 MySQL" >> .env
    echo "DATABASE_URL=\"mysql://username:password@host:port/database_name\"" >> .env
    echo "添加 NEXTAUTH_SECRET 配置..."
    echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
    echo ""
    echo "⚠️  请编辑 .env 文件中的 DATABASE_URL，配置正确的生产环境数据库连接"
fi

if ! grep -q "^NEXTAUTH_SECRET=" .env; then
    echo "添加 NEXTAUTH_SECRET 配置..."
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
    echo "✅ 已自动生成 NEXTAUTH_SECRET"
fi

# 生成 Prisma 客户端
echo "🗄️ 初始化数据库..."
pnpm prisma generate
pnpm prisma migrate deploy

# 构建 Platform
echo "🏗️ 构建 Platform..."
pnpm build

cd ../..

# 创建 PM2 配置文件
if [ ! -f ecosystem.config.js ]; then
    echo "📝 创建 PM2 配置..."
    cat > ecosystem.config.js << EOF
export default {
  apps: [{
    name: 'dify-chat-platform',
    cwd: './packages/platform',
    script: 'pnpm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 5300
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/platform-error.log',
    out_file: './logs/platform-out.log',
    log_file: './logs/platform-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
else
    echo "📝 PM2 配置文件已存在，跳过创建"
fi

# 创建日志目录
mkdir -p logs

# 停止可能存在的旧进程
echo "🛑 停止旧进程..."
pm2 delete dify-chat-platform 2>/dev/null || true

# 启动 Platform 服务
echo "🌟 启动 Platform 服务..."
pm2 start ecosystem.config.js

# 保存 PM2 进程列表
pm2 save

echo ""
echo "✅ 生产环境启动成功！"
echo ""
echo "📱 React App 静态文件: packages/react-app/dist"
echo "🔧 Platform API:      http://localhost:5300"
echo "🔑 生成管理员账户请运行: pnpm create-admin"
echo ""
echo "📊 查看服务状态: pm2 status"
echo "📋 查看日志:     pm2 logs dify-chat-platform"
echo "🛑 停止服务:     pm2 stop dify-chat-platform"
echo "🔄 重启服务:     pm2 restart dify-chat-platform"
echo ""
echo "⚠️  请配置 Nginx 反向代理来提供前端静态文件和 API 服务"
