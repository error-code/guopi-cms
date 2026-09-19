import bcrypt from 'bcryptjs'
import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { admins } from '../../database/schema'
import { fail, setAdminSession } from '../../utils/auth'
import { logSecurity } from '../../utils/security'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const username = String(body?.username || '').trim()
    const password = String(body?.password || '')
    if (!username || !password) fail(400, '请输入用户名和密码')

    const admin = db.select().from(admins).where(eq(admins.username, username)).get()
    if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
        logSecurity(event, 'login_failed', `后台登录失败: ${username}`)
        fail(401, '用户名或密码错误')
    }

    await setAdminSession(event, admin)
    return { user: { id: admin.id, username: admin.username, nickname: admin.nickname } }
})
