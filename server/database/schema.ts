import { sql } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// timestamp mode 存毫秒级 unix 时间戳，默认值用 unixepoch()*1000
const nowMs = sql`(unixepoch() * 1000)`

export const admins = sqliteTable('admins', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    nickname: text('nickname'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
})

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    email: text('email'),
    passwordHash: text('password_hash').notNull(),
    nickname: text('nickname'),
    status: integer('status').notNull().default(1), // 1 启用 / 0 禁用
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
})

export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    sort: integer('sort').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
})

export const tags = sqliteTable('tags', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
})

export const posts = sqliteTable('posts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    summary: text('summary'),
    content: text('content'),
    cover: text('cover'),
    status: text('status').notNull().default('draft'), // draft | published
    isTop: integer('is_top', { mode: 'boolean' }).notNull().default(false),
    views: integer('views').notNull().default(0),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
})

export const postTags = sqliteTable(
    'post_tags',
    {
        postId: integer('post_id')
            .notNull()
            .references(() => posts.id, { onDelete: 'cascade' }),
        tagId: integer('tag_id')
            .notNull()
            .references(() => tags.id, { onDelete: 'cascade' }),
    },
    (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
)

export const pages = sqliteTable('pages', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text('content'),
    status: text('status').notNull().default('published'),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
})

export const media = sqliteTable('media', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filename: text('filename').notNull(),
    path: text('path').notNull(),
    mime: text('mime'),
    size: integer('size'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
})

export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value'),
})

// 导航菜单：parentId 为 null 是一级菜单，指向父级 id 是二级菜单
export const navMenus = sqliteTable('nav_menus', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    parentId: integer('parent_id'),
    label: text('label').notNull(),
    type: text('type').notNull().default('link'), // link | category | page | post
    refId: integer('ref_id'), // category/page/post 的 id（type=link 时为空）
    url: text('url'), // type=link 时的自定义地址
    newTab: integer('new_tab', { mode: 'boolean' }).notNull().default(false),
    sort: integer('sort').notNull().default(0),
})

export type Admin = typeof admins.$inferSelect
export type User = typeof users.$inferSelect
export type Category = typeof categories.$inferSelect
export type Tag = typeof tags.$inferSelect
export type Post = typeof posts.$inferSelect
export type Page = typeof pages.$inferSelect
export type Media = typeof media.$inferSelect
