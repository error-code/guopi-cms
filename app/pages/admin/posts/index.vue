<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Post {
    id: number
    title: string
    slug: string
    status: 'draft' | 'published'
    isTop: boolean
    views: number
    categoryId?: number
    categoryName?: string
    createdAt: string
    publishedAt?: string
}

interface Category {
    id: number
    name: string
}

const toast = useToast()

const page = ref(1)
const pageSize = 10
const keywordInput = ref('')
const keyword = ref('')
const status = ref('all')
const categoryId = ref('all')

const { data: categories } = await useFetch<Category[]>('/api/admin/categories', { default: () => [] })

const query = computed(() => ({
    page: page.value,
    pageSize,
    keyword: keyword.value || undefined,
    status: status.value === 'all' ? undefined : status.value,
    categoryId: categoryId.value === 'all' ? undefined : categoryId.value,
}))
const { data, pending, refresh } = await useFetch<{ list: Post[]; total: number }>('/api/admin/posts', {
    query,
    default: () => ({ list: [], total: 0 }),
})

const statusItems = [
    { label: '全部状态', value: 'all' },
    { label: '已发布', value: 'published' },
    { label: '草稿', value: 'draft' },
]
const categoryItems = computed(() => [
    { label: '全部分类', value: 'all' },
    ...(categories.value ?? []).map((c) => ({ label: c.name, value: String(c.id) })),
])

function onSearch() {
    keyword.value = keywordInput.value.trim()
    page.value = 1
}
watch([status, categoryId], () => {
    page.value = 1
})

const columns = [
    { accessorKey: 'title', header: '标题' },
    { accessorKey: 'categoryName', header: '分类' },
    { accessorKey: 'status', header: '状态' },
    { accessorKey: 'isTop', header: '置顶' },
    { accessorKey: 'views', header: '浏览量' },
    { accessorKey: 'publishedAt', header: '发布时间' },
    { id: 'actions', header: '操作' },
]

// 删除
const deleteTarget = ref<Post | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(post: Post) {
    deleteTarget.value = post
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await $fetch(`/api/admin/posts/${deleteTarget.value.id}`, { method: 'DELETE' })
        toast.add({ title: '文章已删除', color: 'success' })
        deleteOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '删除失败', description: errorMessage(e), color: 'error' })
    } finally {
        deleting.value = false
    }
}
</script>

<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold">文章管理</h1>
                <p class="mt-1 text-sm text-muted">共 {{ data.total }} 篇文章</p>
            </div>
            <UButton icon="i-lucide-plus" label="新建文章" to="/admin/posts/edit" />
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <div class="flex flex-wrap items-center gap-3 border-b border-default p-4">
                <UInput
                    v-model="keywordInput"
                    icon="i-lucide-search"
                    placeholder="搜索标题 / 摘要"
                    class="w-64"
                    @keyup.enter="onSearch"
                />
                <UButton label="搜索" color="neutral" variant="outline" :loading="pending" @click="onSearch" />
                <USelect v-model="status" :items="statusItems" class="w-36" />
                <USelect v-model="categoryId" :items="categoryItems" class="w-40" />
            </div>

            <UTable :data="data.list" :columns="columns" :loading="pending">
                <template #title-cell="{ row }">
                    <div class="max-w-64">
                        <div class="truncate font-medium" :title="row.original.title">
                            {{ row.original.title }}
                        </div>
                        <div class="truncate text-xs text-muted">
                            {{ row.original.slug }}
                        </div>
                    </div>
                </template>
                <template #categoryName-cell="{ row }">
                    {{ row.original.categoryName || '-' }}
                </template>
                <template #status-cell="{ row }">
                    <UBadge
                        :color="row.original.status === 'published' ? 'success' : 'neutral'"
                        variant="subtle"
                        :label="row.original.status === 'published' ? '已发布' : '草稿'"
                    />
                </template>
                <template #isTop-cell="{ row }">
                    <UBadge v-if="row.original.isTop" color="warning" variant="subtle" label="置顶" />
                    <span v-else class="text-muted">-</span>
                </template>
                <template #views-cell="{ row }">
                    {{ row.original.views ?? 0 }}
                </template>
                <template #publishedAt-cell="{ row }">
                    {{ formatDateTime(row.original.publishedAt || row.original.createdAt) }}
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex gap-1">
                        <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-pencil"
                            label="编辑"
                            :to="`/admin/posts/edit?id=${row.original.id}`"
                        />
                        <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-lucide-trash-2"
                            label="删除"
                            @click="askDelete(row.original)"
                        />
                    </div>
                </template>
            </UTable>

            <div class="flex items-center justify-between border-t border-default p-4">
                <span class="text-sm text-muted">共 {{ data.total }} 条</span>
                <UPagination v-model:page="page" :total="data.total" :items-per-page="pageSize" />
            </div>
        </UCard>

        <AdminConfirmModal
            v-model:open="deleteOpen"
            title="删除文章"
            :description="`确定删除文章「${deleteTarget?.title}」吗？此操作不可恢复。`"
            :loading="deleting"
            @confirm="confirmDelete"
        />
    </div>
</template>
