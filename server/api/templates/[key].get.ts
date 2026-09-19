import { defineEventHandler, getRouterParam } from 'h3'
import { fail } from '../../utils/auth'
import { ensureTemplateFiles, getSlot, readTemplateFile } from '../../utils/templates'

// 公开接口：返回模板文件内容（文件即视图）
export default defineEventHandler((event) => {
    const key = getRouterParam(event, 'key') || ''
    const slot = getSlot(key)
    if (!slot) fail(404, '模板不存在')

    ensureTemplateFiles()
    return { key, content: readTemplateFile(key) ?? slot.defaultContent }
})
