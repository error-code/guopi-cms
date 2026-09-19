import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { users } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select().from(users).where(eq(users.id, id)).get()
    if (!existing) fail(404, '用户不存在')

    const body = await readBody(event)
    const status = Number(body?.status)
    if (status !== 0 && status !== 1) fail(400, 'status 只能为 0 或 1')

    db.update(users).set({ status }).where(eq(users.id, id)).run()
    return { ok: true }
})
