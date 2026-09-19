import { defineEventHandler } from 'h3'
import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { categories, posts } from '../database/schema'

export default defineEventHandler(async () => {
    const list = db
        .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            postCount: sql<number>`count(${posts.id})`,
        })
        .from(categories)
        .leftJoin(posts, and(eq(posts.categoryId, categories.id), eq(posts.status, 'published')))
        .groupBy(categories.id)
        .orderBy(asc(categories.sort), asc(categories.id))
        .all()
    return list.filter((c) => c.postCount > 0)
})
