# 前置准备

Dify Chat 的 Platform 服务基于 Next.js + Mysql 实现应用配置的数据持久化，所以在开始部署前，你需要准备好以下环境：

- Node.js >= 20
- Pnpm >= 10.8.1
- MySQL

并构建一个用于存放 Dify Chat 数据的数据库连接：

```shell
mysql://username:password@host:port/database_name
```
