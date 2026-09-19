import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { tags } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select().from(tags).where(eq(tags.id, id)).get()
    if (!existing) fail(404, '标签不存在')

    const body = await readBody(event)
    db.update(tags)
        .set({
            name: body?.name !== undefined ? String(body.name).trim() : existing.name,
            slug:
                body?.slug !== undefined
                    ? uniqueSlug(tags, String(body.slug).trim() || existing.name, id)
                    : existing.slug,
        })
        .where(eq(tags.id, id))
        .run()

    return db.select().from(tags).where(eq(tags.id, id)).get()
})
