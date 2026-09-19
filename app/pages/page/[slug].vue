<script setup lang="ts">
interface PageData {
    id: number
    title: string
    slug: string
    content: string
    updatedAt?: string
}

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: page, error } = await useAsyncData(
    `page-${slug.value}`,
    () => $fetch<PageData>(`/api/pages/${slug.value}`),
    { watch: [slug] },
)
const { data: tpl } = await useAsyncData('tpl-page_detail', () => fetchTemplate('page_detail'))

const notFound = computed(() => !!error.value || !page.value)
const tplHtml = computed(() => {
    if (!page.value) return null
    return renderTemplate(tpl.value, {
        page: { ...page.value, contentHtml: renderMarkdown(page.value.content || '') },
    })
})

useSeoMeta({
    title: () => page.value?.title,
})
</script>

<template>
    <div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <!-- 404 友好提示 -->
        <div v-if="notFound" class="py-24 text-center">
            <UIcon name="i-lucide-file-question" class="mx-auto size-14 text-gray-300" />
            <h1 class="mt-4 text-xl font-bold text-gray-900">页面不存在</h1>
            <p class="mt-2 text-sm text-gray-500">您访问的页面不存在或已被移除</p>
            <UButton to="/" color="primary" class="mt-6">返回首页</UButton>
        </div>

        <div v-else-if="tplHtml" v-html="tplHtml" />
    </div>
</template>
