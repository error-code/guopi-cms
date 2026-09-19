import { defineEventHandler, getRouterParam } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../utils/db'
import { categories, posts, postTags } from '../../../database/schema'
import { fail } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
    const id = Number(getRouterParam(event, 'id'))
    if (!id) fail(400, '参数错误')

    const row = db
        .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            summary: posts.summary,
            content: posts.content,
            cover: posts.cover,
            status: posts.status,
            isTop: posts.isTop,
            views: posts.views,
            categoryId: posts.categoryId,
            categoryName: categories.name,
            createdAt: posts.createdAt,
            updatedAt: posts.updatedAt,
            publishedAt: posts.publishedAt,
        })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(eq(posts.id, id))
        .get()
    if (!row) fail(404, '文章不存在')

    const tagIds = db
        .select({ tagId: postTags.tagId })
        .from(postTags)
        .where(eq(postTags.postId, id))
        .all()
        .map((r) => r.tagId)

    return { ...row, tagIds }
})
