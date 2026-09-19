import { defineEventHandler } from 'h3'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { postTags, tags } from '../../../database/schema'

export default defineEventHandler(async () => {
    const list = db
        .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
            postCount: sql<number>`count(${postTags.postId})`,
        })
        .from(tags)
        .leftJoin(postTags, eq(postTags.tagId, tags.id))
        .groupBy(tags.id)
        .orderBy(asc(tags.id))
        .all()
    return list
})
