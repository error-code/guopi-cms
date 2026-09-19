import { defineEventHandler } from 'h3'
import { inArray } from 'drizzle-orm'
import { db } from '../../utils/db'
import { settings } from '../../database/schema'

const PUBLIC_KEYS = ['siteName', 'logo', 'seoKeywords', 'seoDescription', 'icp', 'phone', 'email', 'address', 'about']

export default defineEventHandler(async () => {
    const rows = db.select().from(settings).where(inArray(settings.key, PUBLIC_KEYS)).all()
    const obj: Record<string, string> = {}
    for (const key of PUBLIC_KEYS) obj[key] = ''
    for (const row of rows) obj[row.key] = row.value ?? ''
    return obj
})
