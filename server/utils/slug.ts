import { and, eq, ne } from 'drizzle-orm'
import { db } from './db'

/** 将标题转成 kebab-case slug；纯中文等无法转换时返回空串，由调用方兜底 */
export function slugify(input: string): string {
    return (input || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * 基于标题生成唯一 slug：
 * - 含英文/数字 → kebab-case
 * - 纯中文无法转换 → p<时间戳> 兜底
 * - 查库冲突时追加 -2、-3… 后缀
 */
export function uniqueSlug(table: any, source: string, excludeId?: number): string {
    const base = slugify(source) || `p${Date.now()}`
    let slug = base
    let n = 1
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const where = excludeId ? and(eq(table.slug, slug), ne(table.id, excludeId)) : eq(table.slug, slug)
        const row = db.select({ id: table.id }).from(table).where(where).get()
        if (!row) return slug
        n += 1
        slug = `${base}-${n}`
    }
}
