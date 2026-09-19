import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { fail } from '../../../utils/auth'
import { getSlot, readTemplateFile, templateFilePath, writeTemplateFile } from '../../../utils/templates'

export default defineEventHandler(async (event) => {
    const key = getRouterParam(event, 'key') || ''
    const slot = getSlot(key)
    if (!slot) fail(404, '模板槽位不存在')

    const body = await readBody(event)
    const existing = readTemplateFile(key)
    const content =
        body?.content !== undefined && String(body.content) !== ''
            ? String(body.content)
            : (existing ?? slot.defaultContent)

    writeTemplateFile(key, content)
    return { ok: true, key, file: templateFilePath(key) }
})
