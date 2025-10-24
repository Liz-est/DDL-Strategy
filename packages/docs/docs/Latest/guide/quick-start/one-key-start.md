# 脚本一键启动

本小节将会教你如何通过脚本一键完成 Dify Chat 的项目构建和启动。

## 1. Clone 项目源码

```bash
git clone git@github.com:lexmin0412/dify-chat.git
```

## 2. 配置环境变量

进入项目目录：

```bash
cd dify-chat
```

配置 react-app 的环境变量：

```bash
cd packages/react-app
cp .env.template .env
```

配置 platform 的环境变量：

```bash
cd packages/platform
# 注意这里要替换 DATABASE_URL 为你自己的数据库连接
cp .env.template .env
```

## 3. 运行一键启动脚本

```bash
chmod +x ./prod-start.sh
./prod-start.sh
```

脚本会帮你自动完成依赖安装，数据库初始化，以及项目启动，稍等片刻后，看到如下图片则表示服务启动成功了：

![启动成功提示](/guide__one_key_start.png)

访问 `http://localhost:5300`，你会看到 Platform 的初始化界面，依次输入用户名、邮箱、密码，即可创建一个管理员账号。此账号可用于 `Dify Chat Platform` 的登录。

对于前端应用，你需要将 `packages/react-app/dist` 中的产物通过 nginx 等静态文件服务器进行部署。
