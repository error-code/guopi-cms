<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Stats {
    posts: number
    publishedPosts: number
    categories: number
    tags: number
    users: number
    media: number
    views: number
}

const { data, pending } = await useFetch<Stats>('/api/admin/stats')

const cards = computed(() => [
    {
        label: '文章总数',
        value: data.value?.posts,
        icon: 'i-lucide-file-text',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    {
        label: '已发布文章',
        value: data.value?.publishedPosts,
        icon: 'i-lucide-send',
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
    {
        label: '分类',
        value: data.value?.categories,
        icon: 'i-lucide-folder',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
    },
    { label: '标签', value: data.value?.tags, icon: 'i-lucide-tags', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: '会员', value: data.value?.users, icon: 'i-lucide-users', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    {
        label: '媒体文件',
        value: data.value?.media,
        icon: 'i-lucide-image',
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
    },
    {
        label: '总浏览量',
        value: data.value?.views,
        icon: 'i-lucide-eye',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
])
</script>

<template>
    <div>
        <div class="mb-6">
            <h1 class="text-xl font-semibold">仪表盘</h1>
            <p class="mt-1 text-sm text-muted">站点数据概览</p>
        </div>

        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            <UCard v-for="card in cards" :key="card.label">
                <div class="flex items-center gap-4">
                    <div class="flex size-12 shrink-0 items-center justify-center rounded-xl" :class="card.bg">
                        <UIcon :name="card.icon" class="size-6" :class="card.color" />
                    </div>
                    <div class="min-w-0">
                        <div class="text-sm text-muted">
                            {{ card.label }}
                        </div>
                        <div class="mt-0.5 text-2xl font-semibold tabular-nums">
                            <template v-if="pending"> — </template>
                            <template v-else>
                                {{ (card.value ?? 0).toLocaleString() }}
                            </template>
                        </div>
                    </div>
                </div>
            </UCard>
        </div>
    </div>
</template>
