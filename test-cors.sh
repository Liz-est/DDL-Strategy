#!/bin/bash
# 测试 document/save 的 OPTIONS 预检请求

echo "=== 测试 OPTIONS 请求到 document/save ==="
curl -i -X OPTIONS \
  -H "Origin: http://localhost:5200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:5300/api/client/document/save

echo -e "\n\n=== 测试 OPTIONS 请求到 academic/sync ==="
curl -i -X OPTIONS \
  -H "Origin: http://localhost:5200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:5300/api/client/academic/sync

echo -e "\n\n=== 完成 ==="
