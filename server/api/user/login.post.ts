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
    if (!username || !password) fail(400, '请输入用户名和密码')

    const user = db.select().from(users).where(eq(users.username, username)).get()
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        fail(401, '用户名或密码错误')
    }
    if (user.status === 0) fail(403, '账号已被禁用')

    await setUserSession(event, user)
    return { user: { id: user.id, username: user.username, nickname: user.nickname } }
})
