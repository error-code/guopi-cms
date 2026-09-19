import { defineEventHandler, getQuery } from 'h3'
import { and, desc, eq, like, sql } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { categories, posts } from '../../../database/schema'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))

    const conditions = []
    if (query.keyword) conditions.push(like(posts.title, `%${String(query.keyword)}%`))
    if (query.status) conditions.push(eq(posts.status, String(query.status)))
    if (query.categoryId) conditions.push(eq(posts.categoryId, Number(query.categoryId)))
    const where = conditions.length ? and(...conditions) : undefined

    const total =
        db
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(where)
            .get()?.count ?? 0

    const list = db
        .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            summary: posts.summary,
            cover: posts.cover,
            status: posts.status,
            isTop: posts.isTop,
            views: posts.views,
            categoryId: posts.categoryId,
            categoryName: categories.name,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
            publishedAt: posts.publishedAt,
        })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(where)
        .orderBy(desc(posts.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

    return { list, total }
})
