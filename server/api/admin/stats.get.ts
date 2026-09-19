import { defineEventHandler } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../utils/db'
import { categories, media, posts, tags, users } from '../../database/schema'

export default defineEventHandler(async () => {
    const postsCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .get()?.count ?? 0
    const publishedPosts =
        db
            .select({ count: sql<number>`count(*)` })
            .from(posts)
            .where(eq(posts.status, 'published'))
            .get()?.count ?? 0
    const categoriesCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(categories)
            .get()?.count ?? 0
    const tagsCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(tags)
            .get()?.count ?? 0
    const usersCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .get()?.count ?? 0
    const mediaCount =
        db
            .select({ count: sql<number>`count(*)` })
            .from(media)
            .get()?.count ?? 0
    const views =
        db
            .select({ total: sql<number>`coalesce(sum(${posts.views}), 0)` })
            .from(posts)
            .get()?.total ?? 0

    return {
        posts: postsCount,
        publishedPosts,
        categories: categoriesCount,
        tags: tagsCount,
        users: usersCount,
        media: mediaCount,
        views,
    }
})
