import { defineEventHandler, getRouterParam } from 'h3'
import { fail } from '../../../utils/auth'
import { getSlot, writeTemplateFile } from '../../../utils/templates'

// 恢复默认 = 用内置默认内容覆盖模板文件
export default defineEventHandler((event) => {
    const key = getRouterParam(event, 'key') || ''
    const slot = getSlot(key)
    if (!slot) fail(404, '模板槽位不存在')

    writeTemplateFile(key, slot.defaultContent)
    return { ok: true }
})
