import { defineEventHandler, getRequestURL, readRawBody } from 'h3'
import {
    detectAttack,
    getClientIp,
    isBlockedIp,
    isRateLimited,
    logSecurity,
    rejectRequest,
    sanitizeLogInput,
} from '../utils/security'

// 不检查的路径前缀（静态资源、图片等）
const SKIP_PREFIXES = ['/_nuxt', '/uploads', '/favicon', '/__nuxt']
// 登录/注册等敏感接口：严格限流 + 请求体攻击检测
const SENSITIVE_PATHS = ['/api/auth/login', '/api/user/login', '/api/user/register']

export default defineEventHandler(async (event) => {
    if (event.method === 'OPTIONS') return
    const url = getRequestURL(event)
    const pathname = url.pathname
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return

    const ip = getClientIp(event)

    // 1. IP 黑名单
    if (isBlockedIp(ip)) {
        // 每个 IP 每分钟最多记一条，避免刷爆日志
        if (!isRateLimited(`blocked-log:${ip}`, 1, 60_000)) {
            logSecurity(event, 'ip_blocked', '黑名单 IP 访问被拒绝')
        }
        return rejectRequest(event, 'ip_blocked')
    }

    // 2. URL 攻击特征检测（query 里常藏注入 payload）
    const urlAttack = detectAttack(pathname + url.search)
    if (urlAttack) {
        let rawUrl = pathname + url.search
        try {
            rawUrl = decodeURIComponent(rawUrl)
        } catch {
            // 保留原始编码
        }
        logSecurity(event, urlAttack, `用户输入(URL): ${rawUrl.slice(0, 500)}`)
        return rejectRequest(event, urlAttack)
    }

    // 3. 敏感接口：限流 + 请求体检测
    if (SENSITIVE_PATHS.includes(pathname)) {
        if (isRateLimited(`sensitive:${ip}:${pathname}`, 10, 5 * 60_000)) {
            logSecurity(event, 'rate_limited', `敏感接口限流: ${pathname}`)
            return rejectRequest(event, 'rate_limited')
        }
        if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
            const raw = await readRawBody(event) // h3 会缓存，后续 readBody 不受影响
            const bodyAttack = detectAttack(raw || '')
            if (bodyAttack) {
                logSecurity(event, bodyAttack, `用户输入(Body): ${sanitizeLogInput(raw || '')}`)
                return rejectRequest(event, bodyAttack)
            }
        }
        return
    }

    // 4. API 全局限流：每 IP 每分钟 300 次
    if (pathname.startsWith('/api/') && isRateLimited(`api:${ip}`, 300, 60_000)) {
        logSecurity(event, 'rate_limited', `API 全局限流: ${pathname}`)
        return rejectRequest(event, 'rate_limited')
    }
})
