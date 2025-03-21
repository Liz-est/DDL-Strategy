import { Typography } from "antd"
import MarkdownIt from 'markdown-it';
import MarkdownItPluginEcharts from '@lexmin0412/markdown-it-echarts'
import { useMemo } from "react";

interface IMarkdownRendererProps {
  /**
   * 原始 Markdown 文本
   */
  markdownText: string
}

const md = MarkdownIt({ html: true, breaks: true }).use(MarkdownItPluginEcharts)

/**
 * Markdown 渲染组件
 */
export const MarkdownRenderer = (props: IMarkdownRendererProps) => {
  const { markdownText } = props

  const dangerousHTML = useMemo(()=>{
    return md.render(markdownText)
  }, [markdownText])

  return (
    <Typography>
      <div className="w-full overflow-hidden" dangerouslySetInnerHTML={{ __html: dangerousHTML }} />
    </Typography>
  )
};