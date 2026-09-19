<script setup lang="ts">
const settings = useSiteSettings()
const route = useRoute()
const { user, fetchMe } = useUserAuth()

onMounted(() => {
    if (!user.value) fetchMe()
})

// 布局模板：templates/site_header.hbs、site_footer.hbs、global_css.css（文件即视图）
const { data: headerTpl } = await useAsyncData('tpl-site_header', () => fetchTemplate('site_header'))
const { data: footerTpl } = await useAsyncData('tpl-site_footer', () => fetchTemplate('site_footer'))
const { data: globalCss } = await useAsyncData('tpl-global_css', () => fetchTemplate('global_css'))
const { data: categories } = await useAsyncData('layout-categories', () =>
    $fetch<{ name: string; slug: string }[]>('/api/categories').catch(() => []),
)
const { data: nav } = await useAsyncData('layout-nav', () => $fetch<any[]>('/api/menus').catch(() => []))

const headerHtml = computed(() =>
    renderTemplate(headerTpl.value, {
        settings: settings.value,
        categories: categories.value ?? [],
        nav: nav.value ?? [],
        path: route.path,
        user: user.value,
    }),
)
const footerHtml = computed(() => renderTemplate(footerTpl.value, { settings: settings.value }))

useHead({
    titleTemplate: (title) => (title ? `${title} - ${settings.value.siteName}` : settings.value.siteName),
})

useSeoMeta({
    description: () => settings.value.seoDescription || `${settings.value.siteName}官方网站`,
    keywords: () => settings.value.seoKeywords,
})
</script>

<template>
    <div class="flex min-h-screen flex-col bg-white">
        <!-- 全局自定义样式（templates/global_css.css） -->
        <component :is="'style'" v-if="globalCss">{{ globalCss }}</component>

        <div v-if="headerHtml" class="tpl-header" v-html="headerHtml" />
        <main class="flex-1">
            <slot />
        </main>
        <div v-if="footerHtml" class="tpl-footer" v-html="footerHtml" />
    </div>
</template>

<style>
:root {
    --ui-primary: var(--color-blue-600);
}
</style>
