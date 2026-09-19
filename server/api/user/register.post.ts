import bcrypt from 'bcryptjs'
import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { users } from '../../database/schema'
import { fail, setUserSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')
    const nickname = String(body?.nickname || '').trim() || username
    const email = String(body?.email || '').trim() || null

    if (username.length < 3) fail(400, '用户名长度至少3位')
    if (password.length < 6) fail(400, '密码长度至少6位')

    const exists = db.select({ id: users.id }).from(users).where(eq(users.username, username)).get()
    if (exists) fail(409, '用户名已存在')

    const row = db
        .insert(users)
        .values({
            username,
            email,
            nickname,
            passwordHash: bcrypt.hashSync(password, 10),
            status: 1,
        })
        .returning()
        .get()

    await setUserSession(event, row)
    return { user: { id: row.id, username: row.username, nickname: row.nickname } }
})
