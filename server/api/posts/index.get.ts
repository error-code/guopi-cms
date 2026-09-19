import { defineEventHandler, getQuery } from 'h3'
import { and, desc, eq, like, or, sql } from 'drizzle-orm'
import { db } from '../../utils/db'
import { categories, posts } from '../../database/schema'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 10))

    const conditions = [eq(posts.status, 'published')]
    if (query.category) conditions.push(eq(categories.slug, String(query.category)))
    if (query.keyword) {
        const kw = `%${String(query.keyword)}%`
        conditions.push(or(like(posts.title, kw), like(posts.summary, kw))!)
    }
    const where = and(...conditions)

    const total =
        db
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .leftJoin(categories, eq(posts.categoryId, categories.id))
            .where(where)
            .get()?.count ?? 0

    const list = db
        .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            summary: posts.summary,
            cover: posts.cover,
            views: posts.views,
            isTop: posts.isTop,
            categoryName: categories.name,
            categorySlug: categories.slug,
            publishedAt: posts.publishedAt,
        })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(where)
        .orderBy(desc(posts.isTop), desc(posts.publishedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

    return { list, total }
})
