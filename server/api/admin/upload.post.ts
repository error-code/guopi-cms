import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { defineEventHandler, readMultipartFormData } from 'h3'
import { db } from '../../utils/db'
import { media } from '../../database/schema'
import { fail } from '../../utils/auth'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export default defineEventHandler(async (event) => {
    const parts = await readMultipartFormData(event)
    const file = parts?.find((p) => p.name === 'file')
    if (!file || !file.data?.length) fail(400, '未接收到文件')
    if (file.data.length > MAX_SIZE) fail(400, '文件大小不能超过 5MB')

    const mime = file.type || 'application/octet-stream'
    if (!ALLOWED_MIME.has(mime)) fail(400, '不支持的文件类型')

    const originalName = file.filename || 'file'
    const ext =
        path
            .extname(originalName)
            .toLowerCase()
            .match(/^\.[a-z0-9]{1,8}$/)?.[0] || ''
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`

    // 按日期分目录存放：/uploads/YYYYMMDD/xxxx.jpg
    const now = new Date()
    const dateDir = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', dateDir)
    fs.mkdirSync(uploadDir, { recursive: true })
    fs.writeFileSync(path.join(uploadDir, filename), file.data)

    const relPath = `/uploads/${dateDir}/${filename}`
    const row = db
        .insert(media)
        .values({
            filename: originalName,
            path: relPath,
            mime,
            size: file.data.length,
        })
        .returning()
        .get()

    return { id: row.id, path: relPath, filename: originalName }
})
