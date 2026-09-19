import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { posts, postTags } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select().from(posts).where(eq(posts.id, id)).get()
    if (!existing) fail(404, '文章不存在')

    const body = await readBody(event)
    const status = body?.status === 'published' ? 'published' : body?.status === 'draft' ? 'draft' : existing.status
    const slug = body?.slug
        ? uniqueSlug(posts, String(body.slug).trim() || String(body?.title || existing.title), id)
        : existing.slug
    const publishedAt = status === 'published' ? (existing.publishedAt ?? new Date()) : existing.publishedAt

    db.update(posts)
        .set({
            title: body?.title !== undefined ? String(body.title).trim() : existing.title,
            slug,
            summary: body?.summary !== undefined ? body.summary : existing.summary,
            content: body?.content !== undefined ? body.content : existing.content,
            cover: body?.cover !== undefined ? body.cover : existing.cover,
            status,
            isTop: body?.isTop !== undefined ? !!body.isTop : existing.isTop,
            categoryId:
                body?.categoryId !== undefined
                    ? body.categoryId
                        ? Number(body.categoryId)
                        : null
                    : existing.categoryId,
            publishedAt,
            updatedAt: new Date(),
        })
        .where(eq(posts.id, id))
        .run()

    if (Array.isArray(body?.tagIds)) {
        db.delete(postTags).where(eq(postTags.postId, id)).run()
        if (body.tagIds.length) {
            db.insert(postTags)
                .values(body.tagIds.map((tagId: number | string) => ({ postId: id, tagId: Number(tagId) })))
                .run()
        }
    }

    const updated = db.select().from(posts).where(eq(posts.id, id)).get()
    return updated
})
