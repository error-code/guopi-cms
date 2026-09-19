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

interface Category {
    id: number
    name: string
    slug: string
    postCount: number
}

const route = useRoute()
const router = useRouter()

const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const category = computed(() => String(route.query.category || ''))

const { data: categories } = await useAsyncData('news-categories', () =>
    $fetch<Category[]>('/api/categories').catch(() => [] as Category[]),
)

const { data, pending } = await useAsyncData(
    'news-list',
    () =>
        $fetch<{ list: PostListItem[]; total: number }>('/api/posts', {
            query: {
                page: page.value,
                pageSize: 10,
                category: category.value || undefined,
            },
        }).catch(() => ({ list: [] as PostListItem[], total: 0 })),
    { watch: [page, category] },
)
const { data: tpl } = await useAsyncData('tpl-news_list', () => fetchTemplate('news_list'))

const list = computed(() => data.value?.list ?? [])
const total = computed(() => data.value?.total ?? 0)

const tplHtml = computed(() =>
    renderTemplate(tpl.value, {
        posts: list.value,
        categories: categories.value ?? [],
        currentCategory: category.value,
    }),
)

const pageModel = computed({
    get: () => page.value,
    set: (v: number) => {
        router.push({ query: { ...route.query, page: v > 1 ? String(v) : undefined } })
    },
})

function categoryLink(slug?: string) {
    return { path: '/news', query: slug ? { category: slug } : {} }
}

useSeoMeta({
    title: '新闻中心',
})
</script>

<template>
    <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900">新闻中心</h1>
            <p class="mt-1 text-sm text-gray-500">了解企业最新动态与行业资讯</p>
        </div>

        <!-- 分类筛选 -->
        <div class="mb-8 flex flex-wrap items-center gap-2">
            <NuxtLink
                :to="categoryLink()"
                class="rounded-full px-4 py-1.5 text-sm transition-colors"
                :class="!category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
                全部
            </NuxtLink>
            <NuxtLink
                v-for="c in categories ?? []"
                :key="c.id"
                :to="categoryLink(c.slug)"
                class="rounded-full px-4 py-1.5 text-sm transition-colors"
                :class="category === c.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
                {{ c.name }}
                <span class="ml-1 text-xs opacity-70">{{ c.postCount }}</span>
            </NuxtLink>
        </div>

        <!-- 加载骨架 -->
        <div v-if="pending" class="space-y-4">
            <div v-for="i in 4" :key="i" class="flex gap-4 rounded-lg border border-gray-200 p-4">
                <USkeleton class="h-28 w-44 shrink-0 rounded-md" />
                <div class="flex-1 space-y-3 py-1">
                    <USkeleton class="h-5 w-2/3" />
                    <USkeleton class="h-4 w-full" />
                    <USkeleton class="h-4 w-1/3" />
                </div>
            </div>
        </div>

        <!-- 文章列表（templates/news_list.hbs） -->
        <template v-else-if="list.length">
            <div v-html="tplHtml" />

            <div v-if="total > 10" class="mt-10 flex justify-center">
                <UPagination v-model:page="pageModel" :total="total" :items-per-page="10" />
            </div>
        </template>

        <div v-else class="rounded-lg border border-dashed border-gray-300 py-20 text-center">
            <UIcon name="i-lucide-inbox" class="mx-auto size-10 text-gray-300" />
            <p class="mt-3 text-gray-400">暂无相关文章</p>
        </div>
    </div>
</template>
