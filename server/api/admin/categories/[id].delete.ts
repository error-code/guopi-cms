import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { categories, posts } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const existing = db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).get()
    if (!existing) fail(404, '分类不存在')

    // 外键 onDelete set null 已配置，此处显式置空以保证行为一致
    db.update(posts).set({ categoryId: null }).where(eq(posts.categoryId, id)).run()
    db.delete(categories).where(eq(categories.id, id)).run()
    return { ok: true }
})
