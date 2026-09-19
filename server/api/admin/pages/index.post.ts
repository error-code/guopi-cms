import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../utils/db'
import { pages } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const title = String(body?.title || '').trim()
    if (!title) fail(400, '标题不能为空')

    const slug = uniqueSlug(pages, String(body?.slug || '').trim() || title)
    const row = db
        .insert(pages)
        .values({
            title,
            slug,
            content: body?.content ?? null,
            status: body?.status === 'draft' ? 'draft' : 'published',
            updatedAt: new Date(),
        })
        .returning()
        .get()
    return row
})
