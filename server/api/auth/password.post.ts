import bcrypt from 'bcryptjs'
import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { admins } from '../../database/schema'
import { fail, requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const admin = await requireAdmin(event)
    const body = await readBody(event)
    const oldPassword = String(body?.oldPassword || '')
    const newPassword = String(body?.newPassword || '')
    if (!oldPassword || !newPassword) fail(400, '请输入旧密码和新密码')
    if (newPassword.length < 6) fail(400, '新密码长度至少6位')

    const row = db.select().from(admins).where(eq(admins.id, admin.id)).get()
    if (!row || !bcrypt.compareSync(oldPassword, row.passwordHash)) {
        fail(400, '旧密码错误')
    }

    db.update(admins)
        .set({ passwordHash: bcrypt.hashSync(newPassword, 10) })
        .where(eq(admins.id, admin.id))
        .run()
    return { ok: true }
})
