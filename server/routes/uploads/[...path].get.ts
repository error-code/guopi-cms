import { createError, defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const MIME: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// 生产构建后 public 被拷贝进 .output，运行时新上传的文件需要通过该路由提供
export default defineEventHandler(async (event) => {
    const raw = getRouterParam(event, 'path') || ''
    const base = path.join(process.cwd(), 'public', 'uploads')
    const file = path.join(base, path.normalize(raw).replace(/^(\.\.[/\\])+/, ''))
    if (!file.startsWith(base)) throw createError({ statusCode: 403, message: '禁止访问' })

    try {
        const data = await readFile(file)
        setResponseHeader(event, 'Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream')
        setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
        return data
    } catch {
        throw createError({ statusCode: 404, message: '文件不存在' })
    }
})
