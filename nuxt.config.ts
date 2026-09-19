export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },
    modules: ['@nuxt/ui'],
    css: ['~/assets/css/main.css'],
    runtimeConfig: {
        // 生产环境务必通过环境变量 NUXT_SESSION_PASSWORD 覆盖
        sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'dev-only-secret-change-me-0123456789abcdef',
    },
    app: {
        head: {
            htmlAttrs: { lang: 'zh-CN' },
        },
    },
})
