# Dify Chat Web

一个基于 Dify API 的 AI 会话 Web APP, 适配深度思考、Dify Chatflow/Workflow 应用、Agent 思维链输出信息。

## 运行截图

`<think>` 标签（DeepSeek 深度思考）：

![Screen Shot](./docs/sample_think_tag.png)

Chatflow 工作流：

![Screen Shot](./docs/sample_workflow.png)

知识库引用链接：

![Screen Shot](./docs/sample_knowledge_base_link.png)

`Echarts` 图表：

![Screen Shot](./docs/sample_echarts.png)   

## 特性

- 💃 灵活部署：无缝接入 Dify Cloud 及私有化部署的 API 服务，全面满足多样化环境需求
- 🚀 高效集成：提供高度可复用的 React 组件，快速嵌入现有应用，加速开发进程
- 🎨 风格适配：支持深度自定义样式与主题，轻松契合业务系统独特风格
- ⚙️ 配置灵活：支持编译时和运行时配置，完美适应各种使用场景

## 技术栈

- React v18
- Ant Design v5
- Ant Design X v1
- Rsbuild v1
- Tailwind CSS v3
- TypeScript v5

## 运行环境

开发/生产构建环境要求：

- Node.js v18.17.1+
- pnpm v8.x

> 注意：本应用使用了 pnpm workspace 来实现 Monorepo 管理，其他包管理工具可能无法正常工作，请先确保你的环境满足以上要求。

## 开始使用

### 1. 获取 Dify 应用配置

为了在此应用对接 Dify API，你需要在 Dify 控制台获取几个关键变量：

|变量|说明|
|---|---|
|API Base|Dify API 请求前缀, 如果你使用的是 Dify 官方提供的云服务，则为 `https://api.dify.ai/v1`|
|Api Key|Dify API 密钥，用于访问对应应用的 API, Dify 应用和 API 密钥是一对多的关系|

进入 Dify 的应用详情，点击左侧的 `访问 API`：

![获取域名和前缀](./docs/get_api_base.jpg)

`API 服务器` 后展示的域名即为 `API Base` 变量的值。

点击右侧的 `API 密钥` 按钮，即可看到 API Key 的管理弹窗：

![获取 API Key](./docs/get_api_key_entry.jpg)

你可以选择创建一个新的 API Key，或者复制现有的 API Key。

![获取 API Key](./docs/get_api_key.jpg)

完成以上步骤后，我们将会得到如下信息：

- API Base: `https://api.dify.ai` OR 私有化部署后的 API 域名 + `/v1`
- API Key: `app-YOUR_API_KEY`

### 1.2 在界面上添加 Dify 应用配置

点击页面左上角 "添加 Dify 应用配置" 按钮：

![添加应用配置按钮](./docs/guide__add_dify_config.png)

即可看到添加配置弹窗，依次填入我们在上一步中获取的信息：

![添加应用配置弹窗](./docs/guide_add_dify_config_modal.png)

点击确定按钮，提示 “添加配置成功”，即可在左侧的应用列表中多出了一条数据：

![添加应用配置成功](./docs/guide__sample_app_config.png)

## 本地开发

安装依赖:

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

构建生产版本：

```bash
pnpm build
```

预览生产版本：

```bash
pnpm preview
```

## Roadmap

- [x] 支持多个会话切换
- [x] 支持点赞/点踩
- [x] 支持消息内容复制
- [x] 支持运行时用户自定义 Dify API 配置
- [x] 兼容 Dify 老版本(<1.0)的消息列表格式
- [x] 支持会话重命名
- [x] 支持深度思考标签（如 DeepSeek-R1 的输出）
- [x] 支持对话时发送图片、消息列表展示图片
- [x] 支持 AI 回复消息展示 Dify 工作流信息及执行状态
- [x] 支持展示思维链
- [x] 支持打断输出
- [x] 移动端适配
- [x] 消息更新时自动滚动到最底部
- [x] 支持知识库引用列表展示 
- [x] 拆分独立组件库，方便二次开发
- [x] 支持 `Echarts` 渲染
- [x] 支持多 Dify 应用管理
- [ ] 国际化
- [ ] 支持单个会话视图
- [ ] 支持消息触顶/触底自动分页加载
- [ ] 支持回复重新生成、父级消息
- [ ] 支持夜间模式
- [ ] 支持自定义主题
- [ ] 补充不同类型应用场景的最佳实践
