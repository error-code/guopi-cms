import { defineEventHandler } from 'h3'
import { clearAdminSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    await clearAdminSession(event)
    return { ok: true }
})
