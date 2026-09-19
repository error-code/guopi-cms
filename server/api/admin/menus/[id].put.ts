import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { navMenus } from '../../../database/schema'
import { fail } from '../../../utils/auth'

const TYPES = new Set(['link', 'category', 'page', 'post'])

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')
    const existing = db.select().from(navMenus).where(eq(navMenus.id, id)).get()
    if (!existing) fail(404, '菜单不存在')

    const body = await readBody(event)
    const label = body?.label !== undefined ? String(body.label).trim() : existing.label
    if (!label) fail(400, '请填写菜单名称')

    const type = body?.type !== undefined && TYPES.has(body.type) ? body.type : existing.type
    const refId = type !== 'link'
        ? (body?.refId !== undefined ? Number(body.refId) || null : existing.refId)
        : null
    const url = type === 'link'
        ? (body?.url !== undefined ? String(body.url).trim() : existing.url)
        : null
    if (type !== 'link' && !refId) fail(400, '请选择关联内容')
    if (type === 'link' && !url) fail(400, '请填写链接地址')

    db.update(navMenus)
        .set({
            label,
            type,
            refId,
            url,
            newTab: body?.newTab === undefined ? existing.newTab : Boolean(body.newTab),
            sort: body?.sort !== undefined ? Number(body.sort) || 0 : existing.sort,
        })
        .where(eq(navMenus.id, id))
        .run()

    return db.select().from(navMenus).where(eq(navMenus.id, id)).get()
})
