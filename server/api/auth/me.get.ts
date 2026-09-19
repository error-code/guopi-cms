import { defineEventHandler } from 'h3'
import { fail, getAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const admin = await getAdmin(event)
    if (!admin) fail(401, '未登录或登录已过期')
    return { user: { id: admin.id, username: admin.username, nickname: admin.nickname } }
})
