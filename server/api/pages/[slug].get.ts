import { defineEventHandler, getRouterParam } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { pages } from '../../database/schema'
import { fail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const slug = String(getRouterParam(event, 'slug') || '')
    if (!slug) fail(400, '参数错误')

    const row = db
        .select({
            id: pages.id,
            title: pages.title,
            slug: pages.slug,
            content: pages.content,
            updatedAt: pages.updatedAt,
        })
        .from(pages)
        .where(and(eq(pages.slug, slug), eq(pages.status, 'published')))
        .get()
    if (!row) fail(404, '页面不存在')

    return row
})
