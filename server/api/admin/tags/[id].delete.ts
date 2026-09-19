import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { postTags, tags } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select({ id: tags.id }).from(tags).where(eq(tags.id, id)).get()
    if (!existing) fail(404, '标签不存在')

    db.delete(postTags).where(eq(postTags.tagId, id)).run()
    db.delete(tags).where(eq(tags.id, id)).run()
    return { ok: true }
})
