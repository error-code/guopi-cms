import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { media } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const row = db.select().from(media).where(eq(media.id, id)).get()
    if (!row) fail(404, '文件不存在')

    // 删除 public 下对应文件（path 形如 /uploads/xxx）
    if (row.path && row.path.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', row.path)
        try {
            fs.unlinkSync(filePath)
        } catch {
            // 文件可能已被手动删除，忽略
        }
    }

    db.delete(media).where(eq(media.id, id)).run()
    return { ok: true }
})
