import { defineEventHandler } from 'h3'
import { getMenuTree } from '../utils/menus'

// 公开接口：前台页头导航（两级），已解析实际链接
export default defineEventHandler(() => {
    return getMenuTree()
        .filter(i => !i.broken)
        .map(i => ({
            id: i.id,
            label: i.label,
            url: i.url,
            newTab: i.newTab,
            children: i.children
                .filter(c => !c.broken)
                .map(c => ({ id: c.id, label: c.label, url: c.url, newTab: c.newTab })),
        }))
})
