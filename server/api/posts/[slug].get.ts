import { defineEventHandler, getRouterParam } from 'h3'
import { and, asc, desc, eq, gt, lt, ne } from 'drizzle-orm'
import { db } from '../../utils/db'
import { categories, posts, postTags, tags } from '../../database/schema'
import { fail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
    const slug = String(getRouterParam(event, 'slug') || '')
    if (!slug) fail(400, '参数错误')

    const row = db
        .select({
            id: posts.id,
            title: posts.title,
            slug: posts.slug,
            content: posts.content,
            cover: posts.cover,
            views: posts.views,
            categoryId: posts.categoryId,
            categoryName: categories.name,
            categorySlug: categories.slug,
            publishedAt: posts.publishedAt,
        })
        .from(posts)
        .leftJoin(categories, eq(posts.categoryId, categories.id))
        .where(and(eq(posts.slug, slug), eq(posts.status, 'published')))
        .get()
    if (!row) fail(404, '文章不存在')

    // 阅读量 +1
    db.update(posts)
        .set({ views: row.views + 1 })
        .where(eq(posts.id, row.id))
        .run()

    const tagList = db
        .select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
        })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, row.id))
        .all()

    const prev =
        db
            .select({ title: posts.title, slug: posts.slug })
            .from(posts)
            .where(and(eq(posts.status, 'published'), lt(posts.id, row.id)))
            .orderBy(desc(posts.id))
            .limit(1)
            .get() ?? null

    const next =
        db
            .select({ title: posts.title, slug: posts.slug })
            .from(posts)
            .where(and(eq(posts.status, 'published'), gt(posts.id, row.id)))
            .orderBy(asc(posts.id))
            .limit(1)
            .get() ?? null

    const related = row.categoryId
        ? db
              .select({ title: posts.title, slug: posts.slug, publishedAt: posts.publishedAt })
              .from(posts)
              .where(and(eq(posts.status, 'published'), eq(posts.categoryId, row.categoryId), ne(posts.id, row.id)))
              .orderBy(desc(posts.publishedAt))
              .limit(4)
              .all()
        : []

    return {
        post: {
            id: row.id,
            title: row.title,
            slug: row.slug,
            content: row.content,
            cover: row.cover,
            views: row.views + 1,
            categoryName: row.categoryName,
            categorySlug: row.categorySlug,
            publishedAt: row.publishedAt,
            tags: tagList,
        },
        prev,
        next,
        related,
    }
})
