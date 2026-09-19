import { defineEventHandler, getQuery } from 'h3'
import { and, desc, eq, like, sql } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { blockedIps, securityLogs } from '../../../database/schema'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const eventType = String(query.event || '')
    const ip = String(query.ip || '').trim()

    const conditions = []
    if (eventType) conditions.push(eq(securityLogs.event, eventType))
    if (ip) conditions.push(like(securityLogs.ip, `%${ip}%`))
    const where = conditions.length ? and(...conditions) : undefined

    const total =
        db
            .select({ count: sql<number>`count(*)` })
            .from(securityLogs)
            .where(where)
            .get()?.count ?? 0
    const list = db
        .select()
        .from(securityLogs)
        .where(where)
        .orderBy(desc(securityLogs.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .all()

    // 统计
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(securityLogs)
            .where(sql`${securityLogs.createdAt} >= ${todayStart.getTime()}`)
            .get()?.count ?? 0
    const totalAll =
        db
            .select({ count: sql<number>`count(*)` })
            .from(securityLogs)
            .get()?.count ?? 0
    const blockedCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(blockedIps)
            .get()?.count ?? 0
    const attackCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(securityLogs)
            .where(like(securityLogs.event, 'attack_%'))
            .get()?.count ?? 0
    const topIps = db
        .select({ ip: securityLogs.ip, count: sql<number>`count(*)` })
        .from(securityLogs)
        .groupBy(securityLogs.ip)
        .orderBy(desc(sql`count(*)`))
        .limit(5)
        .all()

    return { list, total, stats: { todayCount, totalAll, blockedCount, attackCount, topIps } }
})
