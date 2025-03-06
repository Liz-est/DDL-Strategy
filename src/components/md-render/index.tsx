import { Typography } from "antd"
import MarkdownIt from 'markdown-it';

interface IMdRenderProps {
  /**
   * 原始 Markdown 文本
   */
  markdownText: string
}

const md = MarkdownIt({ html: true, breaks: true });

/**
 * Markdown 渲染组件
 */
export default function MdRender(props: IMdRenderProps) {
  const { markdownText } = props

  return (
    <Typography>
      <div dangerouslySetInnerHTML={{ __html: md.render(markdownText) }} />
    </Typography>
  )
}