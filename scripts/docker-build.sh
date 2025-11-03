#!/bin/bash

# Dify Chat Docker 镜像构建和推送脚本
# 用法: ./scripts/docker-build.sh [版本号] [DockerHub用户名]
# 示例: ./scripts/docker-build.sh v1.0.0 yourusername

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取参数
VERSION=${1:-"latest"}
DOCKERHUB_USERNAME=${2:-""}

# 镜像名称配置
REACT_APP_IMAGE="dify-chat-app-react"
PLATFORM_IMAGE="dify-chat-platform"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    print_error "Docker 未安装或不在 PATH 中"
    exit 1
fi

# 检查是否在项目根目录
if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
    print_error "请在项目根目录运行此脚本"
    exit 1
fi

print_info "开始构建 Dify Chat Docker 镜像..."
print_info "版本: $VERSION"

# 构建 React App 镜像
print_info "构建 React App 镜像..."
docker build -f Dockerfile_react_app -t ${REACT_APP_IMAGE}:${VERSION} .
if [ $? -eq 0 ]; then
    print_success "React App 镜像构建完成: ${REACT_APP_IMAGE}:${VERSION}"
else
    print_error "React App 镜像构建失败"
    exit 1
fi

# 构建 Platform 镜像
print_info "构建 Platform 镜像..."
docker build -f Dockerfile_platform -t ${PLATFORM_IMAGE}:${VERSION} .
if [ $? -eq 0 ]; then
    print_success "Platform 镜像构建完成: ${PLATFORM_IMAGE}:${VERSION}"
else
    print_error "Platform 镜像构建失败"
    exit 1
fi

# 如果版本不是 latest，也创建 latest 标签
if [ "$VERSION" != "latest" ]; then
    print_info "创建 latest 标签..."
    docker tag ${REACT_APP_IMAGE}:${VERSION} ${REACT_APP_IMAGE}:latest
    docker tag ${PLATFORM_IMAGE}:${VERSION} ${PLATFORM_IMAGE}:latest
    print_success "latest 标签创建完成"
fi

# 显示构建的镜像
print_info "构建完成的镜像:"
docker images | grep -E "(${REACT_APP_IMAGE}|${PLATFORM_IMAGE})" | head -10

# 如果提供了 DockerHub 用户名，询问是否推送；在 CI 或设置 AUTO_PUSH=true 时自动推送
if [ -n "$DOCKERHUB_USERNAME" ]; then
    if [ "$CI" = "true" ] || [ "$AUTO_PUSH" = "true" ]; then
        REPLY="y"
    else
        echo
        read -p "是否要推送镜像到 DockerHub ($DOCKERHUB_USERNAME)? [y/N]: " -n 1 -r
        echo
    fi

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "开始推送镜像到 DockerHub..."

        # 检查是否已登录 Docker Hub
        if ! docker system info --format '{{.RegistryConfig.IndexConfigs}}' | grep -q "docker.io" 2>/dev/null && \
           ! [ -f ~/.docker/config.json ] || ! grep -q "index.docker.io" ~/.docker/config.json 2>/dev/null; then
            print_warning "请先登录 Docker Hub: docker login"
            exit 1
        fi

        # 为镜像添加 DockerHub 标签
        print_info "添加 DockerHub 标签..."
        docker tag ${REACT_APP_IMAGE}:${VERSION} ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:${VERSION}
        docker tag ${PLATFORM_IMAGE}:${VERSION} ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:${VERSION}

        if [ "$VERSION" != "latest" ]; then
            docker tag ${REACT_APP_IMAGE}:latest ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:latest
            docker tag ${PLATFORM_IMAGE}:latest ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:latest
        fi

        # 推送镜像
        print_info "推送 React App 镜像..."
        docker push ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:${VERSION}
        if [ "$VERSION" != "latest" ]; then
            docker push ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:latest
        fi

        print_info "推送 Platform 镜像..."
        docker push ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:${VERSION}
        if [ "$VERSION" != "latest" ]; then
            docker push ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:latest
        fi

        print_success "镜像推送完成!"
        print_info "React App 镜像: ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:${VERSION}"
        print_info "Platform 镜像: ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:${VERSION}"

        # 生成使用示例
        echo
        print_info "使用示例:"
        echo "docker pull ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:${VERSION}"
        echo "docker pull ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:${VERSION}"
        echo
        echo "或者更新 docker-compose.yml 中的镜像名称:"
        echo "  react-app:"
        echo "    image: ${DOCKERHUB_USERNAME}/${REACT_APP_IMAGE}:${VERSION}"
        echo "  platform:"
        echo "    image: ${DOCKERHUB_USERNAME}/${PLATFORM_IMAGE}:${VERSION}"
    fi
fi

print_success "脚本执行完成!"
