import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { pages } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select().from(pages).where(eq(pages.id, id)).get()
    if (!existing) fail(404, '页面不存在')

    const body = await readBody(event)
    db.update(pages)
        .set({
            title: body?.title !== undefined ? String(body.title).trim() : existing.title,
            slug:
                body?.slug !== undefined
                    ? uniqueSlug(pages, String(body.slug).trim() || existing.title, id)
                    : existing.slug,
            content: body?.content !== undefined ? body.content : existing.content,
            status: body?.status !== undefined ? (body.status === 'draft' ? 'draft' : 'published') : existing.status,
            updatedAt: new Date(),
        })
        .where(eq(pages.id, id))
        .run()

    return db.select().from(pages).where(eq(pages.id, id)).get()
})
