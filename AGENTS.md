# AGENTS Guidelines for This Repository

这个仓库是基于 pnpm workspace 构建的 Monorepo 项目，包含以下几个子包：

- api Dify API 的 Node.js 客户端库
- components 即将废弃，请不要在其他子包中引入，或者修改此包的源码（如果一定要修改，请先取得用户同意）
- core 核心子包，存放核心抽象逻辑
- docs 文档子包，基于 Rspress 构建
- helpers 辅助函数
- platform 平台子包，基于 Next.js 15 App Router 模式，提供应用配置的增删改查和 Dify API 代理
- react-app React 应用子包，提供用户与 Dify 交互的前端界面
- theme 主题子包，提供整个应用的主题相关组件/样式

## 安装/更新依赖

当你需要自行安装/更新依赖时，注意：本项目使用 pnpm-workspace 的 catalog 协议进行依赖管理，所有的依赖版本都是在根目录的 `pnpm-workspace.yaml` 文件的 `catalog` 部分，你需要根据需要修改该文件中的版本号，然后运行 `pnpm install` 命令来安装/更新依赖。
