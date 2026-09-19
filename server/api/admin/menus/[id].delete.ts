import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { navMenus } from '../../../database/schema'
import { fail } from '../../../utils/auth'

// 删除菜单：子菜单一并删除
export default defineEventHandler((event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')
    const existing = db.select().from(navMenus).where(eq(navMenus.id, id)).get()
    if (!existing) fail(404, '菜单不存在')

    db.delete(navMenus).where(eq(navMenus.parentId, id)).run()
    db.delete(navMenus).where(eq(navMenus.id, id)).run()
    return { ok: true }
})
