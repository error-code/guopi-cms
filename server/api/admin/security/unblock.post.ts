import { defineEventHandler, readBody } from 'h3'
import { fail } from '../../../utils/auth'
import { unblockIp } from '../../../utils/security'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const ip = String(body?.ip || '').trim()
    if (!ip) fail(400, '缺少 IP')
    unblockIp(ip)
    return { ok: true }
})
