import type { H3Event } from 'h3'
import { createError, getRequestIP, getRequestURL, setResponseHeader, setResponseStatus } from 'h3'
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
    else if (/iphone os ([\d_]+)/i.test(s)) os = `iPhone (iOS ${RegExp.$1.replace(/_/g, '.')})`
    else if (/ipad.*os ([\d_]+)/i.test(s)) os = `iPad (iOS ${RegExp.$1.replace(/_/g, '.')})`
    else if (/mac os x ([\d_]+)/i.test(s)) os = `macOS ${RegExp.$1.replace(/_/g, '.')}`
    else if (/android ([\d.]+)/i.test(s)) os = `Android ${RegExp.$1}`
    else if (/linux/i.test(s)) os = 'Linux'
    else if (/curl|wget|python-requests|go-http-client|java\//i.test(s)) os = '脚本/工具'

    const ver = (re: RegExp) => {
        const m = s.match(re)
        return m ? ` ${m[1]}` : ''
    }
    let browser = '未知'
    if (/micromessenger/i.test(s)) browser = '微信内置浏览器' + ver(/micromessenger\/([\d.]+)/i)
    else if (/edg\//i.test(s)) browser = 'Edge' + ver(/edg\/([\d.]+)/i)
    else if (/opr\/|opera/i.test(s)) browser = 'Opera' + ver(/(?:opr|opera)\/([\d.]+)/i)
    else if (/qqbrowser/i.test(s)) browser = 'QQ浏览器' + ver(/qqbrowser\/([\d.]+)/i)
    else if (/ucbrowser/i.test(s)) browser = 'UC浏览器' + ver(/ucbrowser\/([\d.]+)/i)
    else if (/chrome\//i.test(s) && !/chromium/i.test(s)) browser = 'Chrome' + ver(/chrome\/([\d.]+)/i)
    else if (/firefox\//i.test(s)) browser = 'Firefox' + ver(/firefox\/([\d.]+)/i)
    else if (/safari\//i.test(s) && /version\//i.test(s)) browser = 'Safari' + ver(/version\/([\d.]+)/i)
    else if (/curl/i.test(s)) browser = 'curl' + ver(/curl\/([\d.]+)/i)
    else if (/wget/i.test(s)) browser = 'wget' + ver(/wget\/([\d.]+)/i)
    else if (/python-requests/i.test(s)) browser = 'Python Requests' + ver(/python-requests\/([\d.]+)/i)
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

// ---- 友好拦截响应 ----

const BLOCK_REASONS: Record<string, { title: string; desc: string }> = {
    attack_sql: {
        title: '检测到 SQL 注入风险',
        desc: '您的请求中包含疑似 SQL 注入的内容，为保障站点数据安全已被拦截。',
    },
    attack_xss: {
        title: '检测到跨站脚本风险',
        desc: '您的请求中包含疑似跨站脚本（XSS）的内容，为保障站点安全已被拦截。',
    },
    attack_path: { title: '检测到非法路径访问', desc: '您的请求试图访问受限的系统路径，已被拦截。' },
    ip_blocked: { title: '访问受限', desc: '您的 IP 地址已被站点管理员限制访问。如有疑问请联系站点管理员。' },
    rate_limited: { title: '请求过于频繁', desc: '您的操作过于频繁，请稍后再试。' },
}

function blockPageHtml(title: string, desc: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
  .box { max-width: 420px; margin: 16px; padding: 40px; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.06); text-align: center; }
  .icon { width: 56px; height: 56px; margin: 0 auto 20px; border-radius: 50%; background: #fef2f2; color: #dc2626; font-size: 28px; line-height: 56px; }
  h1 { margin: 0 0 12px; font-size: 20px; color: #111827; }
  p { margin: 0 0 8px; font-size: 14px; line-height: 1.8; color: #6b7280; }
  .home { display: inline-block; margin-top: 20px; padding: 10px 28px; border-radius: 8px; background: #111827; color: #fff; text-decoration: none; font-size: 14px; }
  .home:hover { background: #374151; }
</style>
</head>
<body>
<div class="box">
  <div class="icon">!</div>
  <h1>${title}</h1>
  <p>${desc}</p>
  <p>如果您认为这是误拦截，请联系站点管理员。</p>
  <a class="home" href="/">返回首页</a>
</div>
</body>
</html>`
}

/** 拦截请求：页面访问返回友好警告页（h3 中间件 return 即作为响应），API 请求抛 JSON 错误 */
export function rejectRequest(event: H3Event, type: SecurityEventType): string | never {
    const info = BLOCK_REASONS[type] || { title: '请求被拦截', desc: '您的请求触发了站点的安全策略。' }
    const pathname = getRequestURL(event).pathname
    const status = type === 'rate_limited' ? 429 : 403
    // API 与 SSE 等接口调用方需要 JSON；页面访问给可读的警告页
    if (pathname.startsWith('/api/') || event.method !== 'GET') {
        throw createError({ statusCode: status, statusMessage: info.title, message: info.desc })
    }
    setResponseStatus(event, status)
    setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
    return blockPageHtml(info.title, info.desc)
}
