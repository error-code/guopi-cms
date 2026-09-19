import { defineEventHandler, readBody } from 'h3'
import { fail } from '../../../utils/auth'
import { blockIp } from '../../../utils/security'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const ip = String(body?.ip || '').trim()
    if (!/^[\d.:a-fA-F]+$/.test(ip) || ip.length > 45) fail(400, 'IP 格式不正确')
    blockIp(ip, String(body?.reason || '').slice(0, 200))
    return { ok: true }
})
