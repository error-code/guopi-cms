import { defineEventHandler } from 'h3'
import { ensureTemplateFiles, readTemplateFile, templateFilePath, templateSlots } from '../../../utils/templates'

export default defineEventHandler(() => {
    ensureTemplateFiles()

    return templateSlots.map((slot) => {
        const content = readTemplateFile(slot.key) ?? slot.defaultContent
        return {
            key: slot.key,
            name: slot.name,
            description: slot.description,
            language: slot.language,
            variables: slot.variables,
            defaultContent: slot.defaultContent,
            isDefault: content === slot.defaultContent,
            content,
            file: templateFilePath(slot.key),
        }
    })
})
