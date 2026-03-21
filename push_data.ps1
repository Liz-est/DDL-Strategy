# 1. 在 Docker 容器内部导出数据到临时文件
docker exec dify-chat-db sh -c "mysqldump -u root -p123456 dify_chat > /tmp/backup.sql"

# 2. 将备份文件从容器拷贝到宿主机的 db_init 目录
# 确保该目录存在
if (!(Test-Path "./db_init")) {
    New-Item -ItemType Directory -Path "./db_init"
}
docker cp dify-chat-db:/tmp/backup.sql ./db_init/init.sql

# 3. 获取当前时间并执行 Git 同步操作
$CurrentTime = Get-Date -Format "yyyy-MM-dd HH:mm"
$CommitMessage = "Sync database state: $CurrentTime"

git add .
# 注意：在 PowerShell 中调用 git commit，双引号里面的变量需要格外小心
git commit -m "$CommitMessage"
git push

Write-Host "--- Success: Database snapshot uploaded to GitHub ---" -ForegroundColor Green