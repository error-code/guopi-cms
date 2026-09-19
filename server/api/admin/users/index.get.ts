import { defineEventHandler, getQuery } from 'h3'
import { desc, like, or, sql } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { users } from '../../../database/schema'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))

    const where = query.keyword
        ? or(like(users.username, `%${String(query.keyword)}%`), like(users.nickname, `%${String(query.keyword)}%`))
        : undefined

    const total =
        db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(where)
            .get()?.count ?? 0

    const list = db
        .select({
            id: users.id,
            username: users.username,
            email: users.email,
            nickname: users.nickname,
            status: users.status,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

    return { list, total }
})
