import { defineEventHandler, getRequestURL } from 'h3'
import { requireAdmin } from '../utils/auth'

// 统一保护 /api/admin/** 接口（OPTIONS 预检除外）
export default defineEventHandler(async (event) => {
    if (event.method === 'OPTIONS') return
    const pathname = getRequestURL(event).pathname
    if (pathname.startsWith('/api/admin/')) {
        await requireAdmin(event)
    }
})
