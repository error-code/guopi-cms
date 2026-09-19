import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { navMenus } from '../../../database/schema'
import { fail } from '../../../utils/auth'

const TYPES = new Set(['link', 'category', 'page', 'post'])

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const label = String(body?.label || '').trim()
    if (!label) fail(400, '请填写菜单名称')

    const type = TYPES.has(body?.type) ? body.type : 'link'
    const parentId = body?.parentId ? Number(body.parentId) : null
    const refId = type !== 'link' && body?.refId ? Number(body.refId) : null
    const url = type === 'link' ? String(body?.url || '').trim() : null
    if (type !== 'link' && !refId) fail(400, '请选择关联内容')
    if (type === 'link' && !url) fail(400, '请填写链接地址')

    // 最多两级：父级必须是一级菜单
    if (parentId) {
        const parent = db.select().from(navMenus).where(eq(navMenus.id, parentId)).get()
        if (!parent) fail(400, '父级菜单不存在')
        if (parent.parentId !== null) fail(400, '导航最多支持两级')
    }

    const row = db
        .insert(navMenus)
        .values({
            parentId,
            label,
            type,
            refId,
            url,
            newTab: Boolean(body?.newTab),
            sort: Number(body?.sort) || 0,
        })
        .returning()
        .get()

    return row
})
