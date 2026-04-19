# 1. 从 GitHub 拉取最新的代码和 init.sql 快照
Write-Host "--- Step 1: Pulling latest changes from GitHub ---" -ForegroundColor Cyan
git pull

# 2. 停止当前运行的容器
Write-Host "--- Step 2: Stopping containers ---" -ForegroundColor Cyan
docker-compose down

# 3. 彻底删除本地旧的数据库二进制文件夹 (mysql_data)
# 这一步是为了强制 Docker 下次启动时重新加载 db_init/init.sql
Write-Host "--- Step 3: Clearing local database cache ---" -ForegroundColor Cyan
if (Test-Path "./mysql_data") {
    Remove-Item -Recurse -Force "./mysql_data" -ErrorAction SilentlyContinue
}

# 4. 重新启动容器
# 当 Docker 发现 mysql_data 为空时，会自动执行挂载在 db_init 目录下的 init.sql
Write-Host "--- Step 4: Rebuilding database from snapshot ---" -ForegroundColor Cyan
docker-compose up -d

Write-Host "`nSuccessfully reset local database and synchronized to the latest state!" -ForegroundColor Green