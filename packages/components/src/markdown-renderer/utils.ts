import MarkdownItPluginEcharts from '@lexmin0412/markdown-it-echarts'
import MarkdownIt from 'markdown-it'
import markdownItPluginKatex from 'markdown-it-katex-gpt'
import MarkdownItMermaid from 'markdown-it-mermaid'

const md = MarkdownIt({ html: true, breaks: true })
	.use(MarkdownItPluginEcharts)
	.use(MarkdownItMermaid)
	.use(markdownItPluginKatex, {
		delimiters: [
			{ left: '\\[', right: '\\]', display: true },
			{ left: '\\(', right: '\\)', display: false },
			{ left: '$$', right: '$$', display: false },
		],
	})

export default md
