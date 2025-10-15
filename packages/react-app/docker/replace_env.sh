#!/bin/sh
# Replace environment variables in env.js

# 设置默认值
PUBLIC_APP_API_BASE=${PUBLIC_APP_API_BASE:-"http://localhost:5300/api/client"}
PUBLIC_DIFY_PROXY_API_BASE=${PUBLIC_DIFY_PROXY_API_BASE:-"http://localhost:5300/api/client/dify"}
PUBLIC_DEBUG_MODE=${PUBLIC_DEBUG_MODE:-"false"}

# 替换环境变量
sed -i "s|{{__PUBLIC_APP_API_BASE__}}|$PUBLIC_APP_API_BASE|g" /usr/share/nginx/html/dify-chat/env.js
sed -i "s|{{__PUBLIC_DIFY_PROXY_API_BASE__}}|$PUBLIC_DIFY_PROXY_API_BASE|g" /usr/share/nginx/html/dify-chat/env.js
sed -i "s|{{__PUBLIC_DEBUG_MODE__}}|$PUBLIC_DEBUG_MODE|g" /usr/share/nginx/html/dify-chat/env.js

echo "Environment variables replaced:"
echo "PUBLIC_APP_API_BASE=$PUBLIC_APP_API_BASE"
echo "PUBLIC_DIFY_PROXY_API_BASE=$PUBLIC_DIFY_PROXY_API_BASE"
echo "PUBLIC_DEBUG_MODE=$PUBLIC_DEBUG_MODE"

exec "$@"