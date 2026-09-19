import { defineEventHandler } from 'h3'
import { db } from '../../../utils/db'
import { securityLogs } from '../../../database/schema'

// 清空安全日志
export default defineEventHandler(async () => {
    db.delete(securityLogs).run()
    return { ok: true }
})
