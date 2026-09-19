import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
    const origin = getRequestURL(event).origin
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /user
Disallow: /api

Sitemap: ${origin}/sitemap.xml
`
})
