# 1. 从 GitHub 拉取最新代码和 init.sql
git pull

# 2. 停止当前运行的容器
docker compose down

# 3. 彻底删除本地旧的数据库二进制文件夹 (mysql_data)
# 使用 -ErrorAction SilentlyContinue 防止文件夹不存在时报错
Remove-Item -Recurse -Force ./mysql_data -ErrorAction SilentlyContinue

# 4. 重新启动容器
# Docker 发现 mysql_data 为空时，会自动执行 db_init/init.sql
docker compose up -d

Write-Output "成功：本地数据库已重置并同步至最新状态。"