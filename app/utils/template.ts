import Handlebars from 'handlebars'

let helpersReady = false

function ensureHelpers() {
    if (helpersReady) return
    helpersReady = true
    Handlebars.registerHelper('formatDate', (v: unknown) => {
        if (!v) return ''
        const d = new Date(v as string | number | Date)
        if (Number.isNaN(d.getTime())) return ''
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
}

/** 用 Handlebars 渲染在线模板；content 为空返回 null 表示回退默认渲染 */
export function renderTemplate(content: string | null | undefined, context: Record<string, unknown>): string | null {
    if (!content) return null
    ensureHelpers()
    try {
        return Handlebars.compile(content)(context)
    } catch {
        return null
    }
}

/** 拉取已启用的自定义模板内容，未配置返回 null（SSR 安全） */
export async function fetchTemplate(key: string): Promise<string | null> {
    try {
        const res = await $fetch<{ content: string }>(`/api/templates/${key}`)
        return res?.content ?? null
    } catch {
        return null
    }
}
