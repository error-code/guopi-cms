import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../utils/db'
import { categories } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    if (!name) fail(400, '名称不能为空')

    const slug = uniqueSlug(categories, String(body?.slug || '').trim() || name)
    const row = db
        .insert(categories)
        .values({
            name,
            slug,
            sort: Number(body?.sort) || 0,
        })
        .returning()
        .get()
    return row
})
