import { asc, eq } from 'drizzle-orm'
import { db } from './db'
import { categories, navMenus, pages, posts } from '../database/schema'

export interface ResolvedMenuItem {
    id: number
    parentId: number | null
    label: string
    type: string
    refId: number | null
    url: string
    newTab: boolean
    sort: number
    broken: boolean // 引用的分类/单页/文章已被删除
    children: ResolvedMenuItem[]
}

type MenuRow = typeof navMenus.$inferSelect

/** 解析菜单项的实际链接 */
export function resolveMenuItem(row: MenuRow): ResolvedMenuItem {
    let url = row.url || ''
    let broken = false

    if (row.type === 'category' && row.refId) {
        const c = db.select().from(categories).where(eq(categories.id, row.refId)).get()
        if (c) url = `/news?category=${c.slug}`
        else broken = true
    } else if (row.type === 'page' && row.refId) {
        const p = db.select().from(pages).where(eq(pages.id, row.refId)).get()
        if (p) url = `/page/${p.slug}`
        else broken = true
    } else if (row.type === 'post' && row.refId) {
        const p = db.select().from(posts).where(eq(posts.id, row.refId)).get()
        if (p) url = `/news/${p.slug}`
        else broken = true
    }

    return {
        id: row.id,
        parentId: row.parentId,
        label: row.label,
        type: row.type,
        refId: row.refId,
        url,
        newTab: row.newTab,
        sort: row.sort,
        broken,
        children: [],
    }
}

/** 读取并组装两级菜单树（按 sort 排序） */
export function getMenuTree(): ResolvedMenuItem[] {
    const rows = db.select().from(navMenus).orderBy(asc(navMenus.sort), asc(navMenus.id)).all()
    const items = rows.map(resolveMenuItem)
    const top = items.filter(i => i.parentId === null)
    const byParent = new Map<number, ResolvedMenuItem[]>()
    for (const item of items.filter(i => i.parentId !== null)) {
        const list = byParent.get(item.parentId!) ?? []
        list.push(item)
        byParent.set(item.parentId!, list)
    }
    for (const item of top) {
        item.children = byParent.get(item.id) ?? []
    }
    return top
}
