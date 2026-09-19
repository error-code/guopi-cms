<script setup lang="ts">
interface Tag {
    id: number
    name: string
    slug: string
}

interface PostDetail {
    id: number
    title: string
    slug: string
    content: string
    cover?: string
    views?: number
    categoryName?: string
    categorySlug?: string
    publishedAt?: string
    tags?: Tag[]
}

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data, error } = await useAsyncData(
    `news-detail-${slug.value}`,
    () =>
        $fetch<{
            post: PostDetail
            prev: { title: string; slug: string } | null
            next: { title: string; slug: string } | null
            related: { title: string; slug: string; publishedAt?: string }[]
        }>(`/api/posts/${slug.value}`),
    { watch: [slug] },
)
const { data: tpl } = await useAsyncData('tpl-post_detail', () => fetchTemplate('post_detail'))

const notFound = computed(() => !!error.value || !data.value?.post)
const post = computed(() => data.value?.post)

const tplHtml = computed(() => {
    if (!post.value) return null
    return renderTemplate(tpl.value, {
        post: { ...post.value, contentHtml: renderMarkdown(post.value.content || '') },
        tags: post.value.tags ?? [],
        prev: data.value?.prev ?? null,
        next: data.value?.next ?? null,
        related: data.value?.related ?? [],
    })
})

const description = computed(() => {
    if (!post.value?.content) return ''
    return post.value.content
        .replace(/[#>*`!\[\]()|-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120)
})

useSeoMeta({
    title: () => post.value?.title,
    description: () => description.value,
    keywords: () => post.value?.tags?.map((t) => t.name).join(','),
})
</script>

<template>
    <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <!-- 404 友好提示 -->
        <div v-if="notFound" class="py-24 text-center">
            <UIcon name="i-lucide-file-x-2" class="mx-auto size-14 text-gray-300" />
            <h1 class="mt-4 text-xl font-bold text-gray-900">文章不存在或已删除</h1>
            <p class="mt-2 text-sm text-gray-500">您访问的文章可能已被移除，去看看其他内容吧</p>
            <UButton to="/news" color="primary" class="mt-6">返回新闻中心</UButton>
        </div>

        <div v-else-if="tplHtml" v-html="tplHtml" />
    </div>
</template>
