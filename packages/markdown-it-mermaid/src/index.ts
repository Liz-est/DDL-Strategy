import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'

// 定义 markdown-it 插件
const markdownItEcharts = (md: MarkdownIt) => {
	md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
		const token = tokens[idx]
		if (token.info === 'mermaid') {
			// setTimeout(() => {
			// 	mermaid.render(id, mermaidCode).then((res) => {
			// 		if (document.getElementById(id)) {
			// 			console.log('res.svg', res.svg)
			// 			document.getElementById(id)!.innerHTML = res.svg;
			// 		}
			// 	})
			// }, 2000);
			return `<div class="mermaid">${token.content}</div>`
		}
		return slf.renderToken(tokens, idx, options)
	}
}

mermaid.initialize({ startOnLoad: true })

export default markdownItEcharts
