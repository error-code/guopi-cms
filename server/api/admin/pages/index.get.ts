import { defineEventHandler } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { pages } from '../../../database/schema'

export default defineEventHandler(async () => {
    const list = db
        .select({
            id: pages.id,
            title: pages.title,
            slug: pages.slug,
            status: pages.status,
            updatedAt: pages.updatedAt,
        })
        .from(pages)
        .orderBy(asc(pages.id))
        .all()
    return list
})
