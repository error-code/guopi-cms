import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../utils/db'
import { pages, posts } from '../database/schema'

function escapeXml(s: string) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function toW3CDate(d: Date | string | number | null | undefined) {
    if (!d) return undefined
    const date = new Date(d)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10)
}

export default defineEventHandler((event) => {
    const origin = getRequestURL(event).origin

    const publishedPosts = db
        .select({ slug: posts.slug, publishedAt: posts.publishedAt, updatedAt: posts.updatedAt })
        .from(posts)
        .where(eq(posts.status, 'published'))
        .all()

    const publishedPages = db
        .select({ slug: pages.slug, updatedAt: pages.updatedAt })
        .from(pages)
        .where(eq(pages.status, 'published'))
        .all()

    const urls: Array<{ loc: string; lastmod?: string; priority: string }> = [
        { loc: '/', priority: '1.0' },
        { loc: '/news', priority: '0.8' },
        ...publishedPages.map((p) => ({
            loc: `/page/${p.slug}`,
            lastmod: toW3CDate(p.updatedAt),
            priority: '0.6',
        })),
        ...publishedPosts.map((p) => ({
            loc: `/news/${p.slug}`,
            lastmod: toW3CDate(p.updatedAt || p.publishedAt),
            priority: '0.7',
        })),
    ]

    const body = urls
        .map(
            (u) => `  <url>
    <loc>${escapeXml(origin + u.loc)}</loc>${
        u.lastmod
            ? `
    <lastmod>${u.lastmod}</lastmod>`
            : ''
    }
    <priority>${u.priority}</priority>
  </url>`,
        )
        .join('\n')

    setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`
})
