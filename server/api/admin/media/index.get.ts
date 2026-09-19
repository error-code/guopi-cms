import { defineEventHandler, getQuery } from 'h3'
import { desc, sql } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { media } from '../../../database/schema'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))

    const total =
        db
            .select({ count: sql<number>`count(*)` })
            .from(media)
            .get()?.count ?? 0
    const list = db
        .select()
        .from(media)
        .orderBy(desc(media.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

    return { list, total }
})
