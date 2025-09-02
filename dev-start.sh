#!/bin/bash

# 本地开发启动脚本
# 当 Docker 镜像拉取失败时的备用方案

set -e

echo "🚀 启动 Dify Chat 本地开发环境..."

# 检查 Node.js 和 pnpm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm 未安装，正在安装..."
    npm install -g pnpm
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建基础包
echo "🔨 构建基础包..."
pnpm build:pkgs

# 启动服务
echo "🌟 启动服务..."

# 启动 React App (端口 5200)
echo "启动 React App..."
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

pnpm dev &
REACT_PID=$!
cd ../..

# 启动 Platform (端口 5300)
echo "启动 Platform..."
cd packages/platform

# 检查开发环境配置文件
if [ ! -f .env ]; then
    echo "创建 Platform 开发环境配置文件..."
    touch .env
fi

# 检查必要的环境变量
if ! grep -q "^DATABASE_URL=" .env; then
    echo "添加 DATABASE_URL 配置..."
    echo "# Database - 开发环境使用 SQLite" >> .env
    echo "DATABASE_URL=\"file:./dev.db\"" >> .env
fi

if ! grep -q "^NEXTAUTH_SECRET=" .env; then
    echo "添加 NEXTAUTH_SECRET 配置..."
    echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
    echo "✅ 已自动生成 NEXTAUTH_SECRET"
fi

# 生成 Prisma 客户端
pnpm prisma generate
pnpm prisma db push

PORT=5300 pnpm dev &
PLATFORM_PID=$!
cd ../..

echo ""
echo "✅ 服务启动成功！"
echo ""
echo "📱 React App:  http://localhost:5200"
echo "🔧 Platform:   http://localhost:5300"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 停止服务...'; kill $REACT_PID $PLATFORM_PID 2>/dev/null; exit 0" INT

# 保持脚本运行
wait
