import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../utils/db'
import { settings } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, '请求体必须是对象')

    for (const [key, value] of Object.entries(body)) {
        const v = String(value ?? '')
        db.insert(settings)
            .values({ key, value: v })
            .onConflictDoUpdate({ target: settings.key, set: { value: v } })
            .run()
    }

    const rows = db.select().from(settings).all()
    const obj: Record<string, string> = {}
    for (const row of rows) {
        obj[row.key] = row.value ?? ''
    }
    return obj
})
