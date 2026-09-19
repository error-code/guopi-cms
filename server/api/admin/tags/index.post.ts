import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../utils/db'
import { tags } from '../../../database/schema'
import { fail } from '../../../utils/auth'
import { uniqueSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    if (!name) fail(400, '名称不能为空')

    const slug = uniqueSlug(tags, String(body?.slug || '').trim() || name)
    const row = db.insert(tags).values({ name, slug }).returning().get()
    return row
})
