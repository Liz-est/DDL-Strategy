# 内容渲染

Dify Chat 支持对 AI 回复的各种内容进行渲染，包括图片、视频、代码、图表，以及 Dify 自身返回的各种特殊格式。

## 深度思考标签

目前流行的深度思考标签主要有两种：

- `<think>`
- `<details>`

以上两种标签在 Dify Chat 中都被很好地支持，展示效果如下：

![深度思考](/sample_think_tag.png)

## Chatflow / Workflow 工作流日志

在 Dify 的 Chatflow/Workflow 类型应用运行时，Dify API 会返回工作流日志，展示形式如下：

![Workflow Logs](/sample_workflow.png)

## Agent 调用工具

在 Dify 的 Agent 类型应用运行时，如果有调用到工具，Dify API 会返回工具的调用日志，展示形式如下：

![Agent 调用工具截图](/guide_app_agent.png)

## 知识库引用链接

在 AI 回复过程中，如果引用到了知识库的内容，展示效果如下：

![知识库引用](/sample_knowledge_base_link.png)

当鼠标 hover 到引用链接上时，会展示具体的片段：

![知识库引用-详情](/sample_knowledge_base_link_hover.png)

## Echarts 图表

支持渲染通过官方的图表插件生成的，或符合 Echarts 数据格式的代码块为图表：

![Echarts](/sample_echarts.png)

## Mermaid 图表

Mermaid 是一种流行的文本绘图格式，展示效果如下：

![Mermaid](/guide__sample_mermaid.png)

## 文件卡片

如果用户发送或者 AI 回复了文件，在对话中的展示效果如下：

![文件卡片](/sample_file.jpg)

## 回复表单

当用户在应用配置中启用了 "表单回复"，并且 AI 回复了表单内容，用户就可以进行表单内容填写，并点击提交按钮，这会发送一条消息，也就是将填写的表单信息作为参数提交到 Dify Chatflow 内容的开始节点：

![回复表单](/guide__sample_form.png)
