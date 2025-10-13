**Docker打包说明**

# 文件说明

- docker_community_solutions目录下存放了前端、后端环境文件以及Nginx配置文件；
- env-frontend.example为前端服务环境文件，其中文件里IP地址需改为你实际部署服务的IP地址。
- env-backend.example没有特殊情况，可以不修改。如果用Postgresql/Sql需特别修改。
- nginx.conf.example按需修改，可以在Docker run的时候采用映射模式后续修改。

# 打包过程

```
# 注意:在docker_community_solutions下时，后面上下文为..
docker build -f ./Dockerfile_allinone -t dify-chat:0.5.5 ..
# 如果在主目录请运行下面命令打包
docker build -f ./docker_community_solutions/Dockerfile_allinone -t dify-chat:0.5.5 .
```

# Docker 运行命令

```
docker run -d --name dify-chat \
-p 5300:5300 \
-p 80:80 \
dify-chat:0.5.5
```

# 初始化管理员

```
docker exec -it dify-chat /bin/bash
pnpm create-admin
#输入邮箱、密码、用户名后exit退出
```

# 访问方法

- 后端：http://serverip:5300/
- 前端：http://serverip/dify-chat/
