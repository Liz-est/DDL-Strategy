import MarkdownItPluginEcharts from '@lexmin0412/markdown-it-echarts'
import MarkdownIt from 'markdown-it'
import markdownItPluginDiagram from 'markdown-it-diagram'
import markdownItPluginKatex from 'markdown-it-katex-gpt'

const md = MarkdownIt({ html: true, breaks: true })
	.use(MarkdownItPluginEcharts)
	.use(markdownItPluginKatex, {
		delimiters: [
			{ left: '\\[', right: '\\]', display: true },
			{ left: '\\(', right: '\\)', display: false },
			{ left: '$$', right: '$$', display: false },
		],
	})
	.use(markdownItPluginDiagram)

export default md
