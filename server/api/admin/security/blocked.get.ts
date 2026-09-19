import { defineEventHandler } from 'h3'
import { desc } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { blockedIps } from '../../../database/schema'

export default defineEventHandler(async () => {
    const list = db.select().from(blockedIps).orderBy(desc(blockedIps.id)).all()
    return { list }
})
