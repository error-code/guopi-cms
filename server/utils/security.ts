import type { H3Event } from 'h3'
import { createError, getRequestIP, getRequestURL } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from './db'
import { blockedIps, securityLogs } from '../database/schema'

export type SecurityEventType =
    'attack_sql' | 'attack_xss' | 'attack_path' | 'login_failed' | 'login_locked' | 'rate_limited' | 'ip_blocked'

// ---- 客户端信息 ----

export function getClientIp(event: H3Event): string {
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    return ip.replace(/^::ffff:/, '')
}

export function parseUserAgent(ua: string): { os: string; browser: string } {
    const s = ua || ''
    let os = '未知'
    if (/windows nt 10/i.test(s)) os = 'Windows 10/11'
    else if (/windows nt 6\.3/i.test(s)) os = 'Windows 8.1'
    else if (/windows nt 6\.1/i.test(s)) os = 'Windows 7'
    else if (/windows/i.test(s)) os = 'Windows'
    else if (/iphone/i.test(s)) os = 'iPhone'
    else if (/ipad/i.test(s)) os = 'iPad'
    else if (/mac os x/i.test(s)) os = 'macOS'
    else if (/android/i.test(s)) os = 'Android'
    else if (/linux/i.test(s)) os = 'Linux'
    else if (/curl|wget|python-requests|go-http-client|java\//i.test(s)) os = '脚本/工具'

    let browser = '未知'
    if (/micromessenger/i.test(s)) browser = '微信内置浏览器'
    else if (/edg\//i.test(s)) browser = 'Edge'
    else if (/opr\/|opera/i.test(s)) browser = 'Opera'
    else if (/chrome\//i.test(s) && !/chromium/i.test(s)) browser = 'Chrome'
    else if (/firefox\//i.test(s)) browser = 'Firefox'
    else if (/safari\//i.test(s) && /version\//i.test(s)) browser = 'Safari'
    else if (/curl/i.test(s)) browser = 'curl'
    else if (/wget/i.test(s)) browser = 'wget'
    else if (/python-requests/i.test(s)) browser = 'Python Requests'
    else if (/go-http-client/i.test(s)) browser = 'Go HTTP Client'
    else if (/bot|spider|crawler|slurp/i.test(s)) browser = '爬虫/机器人'

    return { os, browser }
}

// ---- 日志 ----

export function logSecurity(event: H3Event, type: SecurityEventType, detail?: string) {
    try {
        const ua = event.node.req.headers['user-agent'] || ''
        const { os, browser } = parseUserAgent(ua)
        db.insert(securityLogs)
            .values({
                ip: getClientIp(event),
                method: event.method,
                path: getRequestURL(event).pathname.slice(0, 500),
                userAgent: ua.slice(0, 500),
                os,
                browser,
                event: type,
                detail: (detail || '').slice(0, 1000),
                createdAt: new Date(),
            })
            .run()
    } catch {
        // 日志失败不阻断请求
    }
}

// ---- 攻击特征检测 ----

const SQL_PATTERNS = [
    /union[\s/]+(all[\s/]+)?select/i,
    /select.+from.+information_schema/i,
    /('\s*(or|and)\s*'?\d+'?\s*=\s*'?\d+)/i,
    /('\s*(or|and)\s*'[^']*'='[^']*)/i,
    /drop\s+table/i,
    /\bexec(ute)?\s*\(/i,
    /benchmark\s*\(|sleep\s*\(\s*\d/i,
    /load_file\s*\(|into\s+(out|dump)file/i,
]
const XSS_PATTERNS = [/<\s*script/i, /javascript\s*:/i, /on(error|load|click|focus)\s*=/i, /<\s*iframe/i]
const PATH_PATTERNS = [/\.\.[\\/]/, /%2e%2e/i, /\/etc\/passwd/i, /\\windows\\system32/i, /php:\/\/(input|filter)/i]

export function detectAttack(input: string): SecurityEventType | null {
    if (!input) return null
    let decoded = input
    try {
        decoded = decodeURIComponent(input)
    } catch {
        // 非法编码本身就是可疑信号
        return 'attack_path'
    }
    for (const p of SQL_PATTERNS) if (p.test(decoded)) return 'attack_sql'
    for (const p of XSS_PATTERNS) if (p.test(decoded)) return 'attack_xss'
    for (const p of PATH_PATTERNS) if (p.test(decoded)) return 'attack_path'
    return null
}

// ---- 限流（内存滑动窗口） ----

interface Bucket {
    count: number
    resetAt: number
}
const buckets = new Map<string, Bucket>()

// 定期清理过期桶，避免内存膨胀
setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
}, 60_000).unref?.()

/** 超过限制返回 true */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
    const now = Date.now()
    let b = buckets.get(key)
    if (!b || b.resetAt < now) {
        b = { count: 0, resetAt: now + windowMs }
        buckets.set(key, b)
    }
    b.count++
    return b.count > max
}

// ---- IP 黑名单 ----

let blockCache: { list: Set<string>; loadedAt: number } | null = null

export function isBlockedIp(ip: string): boolean {
    if (!blockCache || Date.now() - blockCache.loadedAt > 30_000) {
        const rows = db.select({ ip: blockedIps.ip }).from(blockedIps).all()
        blockCache = { list: new Set(rows.map((r) => r.ip)), loadedAt: Date.now() }
    }
    return blockCache.list.has(ip)
}

export function refreshBlockCache() {
    blockCache = null
}

export function blockIp(ip: string, reason?: string) {
    db.insert(blockedIps).values({ ip, reason }).onConflictDoNothing().run()
    refreshBlockCache()
}

export function unblockIp(ip: string) {
    db.delete(blockedIps).where(eq(blockedIps.ip, ip)).run()
    refreshBlockCache()
}

export function forbidden(message: string): never {
    throw createError({ statusCode: 403, statusMessage: message })
}
