import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { pages } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select({ id: pages.id }).from(pages).where(eq(pages.id, id)).get()
    if (!existing) fail(404, '页面不存在')

    db.delete(pages).where(eq(pages.id, id)).run()
    return { ok: true }
})
