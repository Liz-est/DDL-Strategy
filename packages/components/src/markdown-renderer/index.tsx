import { IFile } from '@dify-chat/api'
import { Typography } from 'antd'
import { useEffect, useMemo } from 'react'

import './index.css'
import md from './utils'

interface IMarkdownRendererProps {
	/**
	 * 提交消息
	 */
	onSubmit?: (value: string, files?: IFile[]) => void
	/**
	 * 原始 Markdown 文本
	 */
	markdownText: string
}

/**
 * Markdown 渲染组件
 */
export const MarkdownRenderer = (props: IMarkdownRendererProps) => {
	const { onSubmit, markdownText } = props

	useEffect(() => {
		md.renderer.rules.html_block = function (tokens, idx) {
			let html = tokens[idx].content

			// 匹配 form 标签
			// 修改正则表达式，去掉 's' 标志，并手动处理换行符
			const formRegex = /<form([^>]*)>((?:.|\n)*?)<\/form>/g
			html = html.replace(formRegex, function (match, attrs, content) {
				const customAttrs = `class="dc-answer-form-button"; onSubmit="event.preventDefault(); window.handleFormSubmit(event); return false;" ${attrs}`
				return `<form ${customAttrs}>${content}</form>`
			})

			// 匹配 button 标签
			const buttonRegex = /<button([^>]*)>(.*?)<\/button>/g
			html = html.replace(buttonRegex, function (_match, attrs, content) {
				// 这里可以自定义 button 标签的属性和内容
				const customAttrs = 'class="dc-answer-form-button" ' + attrs
				// 在按钮标签中添加点击事件，调用 window 的 handleFormButtonClick 方法
				return `<button ${customAttrs} onclick="window.handleFormButtonClick(event)">${content}</button>`
			})

			return html
		}

		// 注册 handleFormButtonClick
		// @ts-expect-error 后续补充类型声明
		window.handleFormSubmit = function (event) {
			// 遍历所有的子元素
			const values: Record<string, string> = {}
			for (let i = 0; i < event.srcElement.children.length; i++) {
				const child = event.srcElement.children[i]
				// 如果子元素是 button 标签
				if (child.tagName === 'INPUT') {
					// 调用 button 的 click 方法
					values[child.name] = child.value
				} else if (child.tagName === 'TEXTAREA') {
					values[child.name] = child.value
				}
			}
			onSubmit?.(JSON.stringify(values))
		}
	}, [])

	const dangerousHTML = useMemo(() => {
		return md.render(markdownText)
	}, [markdownText])

	return (
		<Typography>
			<div
				className="w-full overflow-hidden"
				dangerouslySetInnerHTML={{ __html: dangerousHTML }}
			/>
		</Typography>
	)
}
