import { defineNitroPlugin } from 'nitropack/runtime'
import { ensureTemplateFiles } from '../utils/templates'

// 启动时把缺失的模板文件以默认内容补齐（已有文件不覆盖）
export default defineNitroPlugin(() => {
    ensureTemplateFiles()
})
