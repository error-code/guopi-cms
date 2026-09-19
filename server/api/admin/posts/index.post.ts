import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../utils/db'
import { posts, postTags } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const title = String(body?.title || '').trim()
    if (!title) fail(400, '标题不能为空')

    const status = body?.status === 'published' ? 'published' : 'draft'
    const now = new Date()
    const slug = uniqueSlug(posts, String(body?.slug || '').trim() || title)

    const row = db
        .insert(posts)
        .values({
            title,
            slug,
            summary: body?.summary ?? null,
            content: body?.content ?? null,
            cover: body?.cover ?? null,
            status,
            isTop: !!body?.isTop,
            categoryId: body?.categoryId ? Number(body.categoryId) : null,
            createdAt: now,
            updatedAt: now,
            publishedAt: status === 'published' ? now : null,
        })
        .returning()
        .get()

    if (Array.isArray(body?.tagIds) && body.tagIds.length) {
        db.insert(postTags)
            .values(body.tagIds.map((tagId: number | string) => ({ postId: row.id, tagId: Number(tagId) })))
            .run()
    }

    return row
})
