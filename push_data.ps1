# 1. 在 Docker 容器内部导出数据到临时文件
docker exec dify-chat-db sh -c "mysqldump -u root -p123456 dify_chat > /tmp/backup.sql"

# 2. 将备份文件从容器拷贝到宿主机的 db_init 目录
# 确保该目录存在
if (!(Test-Path -Path "./db_init")) {
    New-Item -ItemType Directory -Path "./db_init"
}
docker cp dify-chat-db:/tmp/backup.sql ./db_init/init.sql

# 3. 执行 Git 同步操作
git add .
git commit -m "Sync database state: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push

Write-Output "成功：数据库快照已上传至 GitHub。"