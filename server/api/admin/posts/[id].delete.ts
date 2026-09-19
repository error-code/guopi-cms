import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { posts, postTags } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).get()
    if (!existing) fail(404, '文章不存在')

    db.delete(postTags).where(eq(postTags.postId, id)).run()
    db.delete(posts).where(eq(posts.id, id)).run()
    return { ok: true }
})
