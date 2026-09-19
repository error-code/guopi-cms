import { marked } from 'marked'

marked.setOptions({
    gfm: true,
    breaks: true,
})

/**
 * 将 Markdown 渲染为 HTML 字符串（前后台共用）。
 * 注意：输出未做 XSS 过滤，仅用于可信的管理员内容。
 */
export function renderMarkdown(md: string): string {
    if (!md) return ''
    return marked.parse(md, { async: false }) as string
}
