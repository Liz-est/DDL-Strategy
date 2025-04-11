import MarkdownItPluginEcharts from '@lexmin0412/markdown-it-echarts'
import classnames from 'classnames'
import MarkdownIt from 'markdown-it'
import markdownItPluginKatex from 'markdown-it-katex-gpt'
import { twMerge } from 'tailwind-merge'

export const cn = (...cls: classnames.ArgumentArray) => {
	return twMerge(classnames(cls))
}

const md = MarkdownIt({ html: true, breaks: true })
	.use(MarkdownItPluginEcharts)
	.use(markdownItPluginKatex, {
		delimiters: [
			{ left: '\\[', right: '\\]', display: true },
			{ left: '\\(', right: '\\)', display: false },
			{ left: '$$', right: '$$', display: false },
		],
	})

export default md
