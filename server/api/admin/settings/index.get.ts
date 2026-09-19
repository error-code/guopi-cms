import { defineEventHandler } from 'h3'
import { db } from '../../../utils/db'
import { settings } from '../../../database/schema'

export default defineEventHandler(async () => {
    const rows = db.select().from(settings).all()
    const obj: Record<string, string> = {}
    for (const row of rows) {
        obj[row.key] = row.value ?? ''
    }
    return obj
})
