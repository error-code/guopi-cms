import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { pages } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const page = db.select().from(pages).where(eq(pages.id, id)).get()
    if (!page) fail(404, '页面不存在')

    return page
})
