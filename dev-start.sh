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
pnpm dev &
REACT_PID=$!
cd ../..

# 启动 Platform (端口 5300)
echo "启动 Platform..."
cd packages/platform
# 检查是否有 .env 文件
if [ ! -f .env ]; then
    echo "创建 Platform .env 文件..."
    cat > .env << EOF
# Database
DATABASE_URL="file:./dev.db"
EOF
fi

# 生成 Prisma 客户端
pnpm prisma generate
pnpm prisma db push

pnpm dev &
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
