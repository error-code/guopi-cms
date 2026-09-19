<script setup lang="ts">
interface PostListItem {
    id: number
    title: string
    slug: string
    summary?: string
    cover?: string
    views?: number
    isTop?: boolean
    categoryName?: string
    categorySlug?: string
    publishedAt?: string
}

const settings = useSiteSettings()

const { data } = await useAsyncData('home-posts', () =>
    $fetch<{ list: PostListItem[]; total: number }>('/api/posts', {
        query: { page: 1, pageSize: 9 },
    }).catch(() => ({ list: [] as PostListItem[], total: 0 })),
)
const { data: tpl } = await useAsyncData('tpl-home', () => fetchTemplate('home'))

const posts = computed(() => data.value?.list ?? [])

// 置顶/推荐文章（模板里用作 Banner 等）
const topPosts = computed(() => {
    const tops = posts.value.filter((p) => p.isTop)
    return (tops.length > 0 ? tops : posts.value).slice(0, 5)
})

const tplHtml = computed(() =>
    renderTemplate(tpl.value, {
        settings: settings.value,
        topPosts: topPosts.value,
        posts: posts.value.slice(0, 6),
    }),
)

useSeoMeta({
    title: () => settings.value.siteName,
})
</script>

<template>
    <div v-if="tplHtml" v-html="tplHtml" />
</template>
