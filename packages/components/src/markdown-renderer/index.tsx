import { Typography } from "antd"
import MarkdownIt from 'markdown-it';
import MarkdownItPluginEcharts from './echarts-plugin'
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
      <div dangerouslySetInnerHTML={{ __html: dangerousHTML }} />
    </Typography>
  )
};