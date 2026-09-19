import { defineEventHandler } from 'h3'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { categories, posts } from '../../../database/schema'

export default defineEventHandler(async () => {
    const list = db
        .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            sort: categories.sort,
            createdAt: categories.createdAt,
            postCount: sql<number>`count(${posts.id})`,
        })
        .from(categories)
        .leftJoin(posts, eq(posts.categoryId, categories.id))
        .groupBy(categories.id)
        .orderBy(asc(categories.sort), asc(categories.id))
        .all()
    return list
})
