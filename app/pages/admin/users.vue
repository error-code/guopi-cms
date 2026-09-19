<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Member {
    id: number
    username: string
    email: string
    nickname: string
    status: number
    createdAt: string
}

const toast = useToast()

const page = ref(1)
const pageSize = 10
const keywordInput = ref('')
const keyword = ref('')

const query = computed(() => ({
    page: page.value,
    pageSize,
    keyword: keyword.value || undefined,
}))
const { data, pending, refresh } = await useFetch<{ list: Member[]; total: number }>('/api/admin/users', {
    query,
    default: () => ({ list: [], total: 0 }),
})

function onSearch() {
    keyword.value = keywordInput.value.trim()
    page.value = 1
}

const columns = [
    { accessorKey: 'username', header: '用户名' },
    { accessorKey: 'nickname', header: '昵称' },
    { accessorKey: 'email', header: '邮箱' },
    { accessorKey: 'status', header: '状态' },
    { accessorKey: 'createdAt', header: '注册时间' },
    { id: 'actions', header: '操作' },
]

// 启用 / 禁用
const togglingId = ref<number | null>(null)

async function toggleStatus(item: Member) {
    const next = item.status === 1 ? 0 : 1
    togglingId.value = item.id
    try {
        await $fetch(`/api/admin/users/${item.id}`, { method: 'PUT', body: { status: next } })
        toast.add({ title: next === 1 ? `已启用「${item.username}」` : `已禁用「${item.username}」`, color: 'success' })
        await refresh()
    } catch (e) {
        toast.add({ title: '操作失败', description: errorMessage(e), color: 'error' })
    } finally {
        togglingId.value = null
    }
}
</script>

<template>
    <div>
        <div class="mb-6">
            <h1 class="text-xl font-semibold">会员管理</h1>
            <p class="mt-1 text-sm text-muted">共 {{ data.total }} 位会员</p>
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <div class="flex flex-wrap items-center gap-3 border-b border-default p-4">
                <UInput
                    v-model="keywordInput"
                    icon="i-lucide-search"
                    placeholder="搜索用户名 / 昵称 / 邮箱"
                    class="w-72"
                    @keyup.enter="onSearch"
                />
                <UButton label="搜索" color="neutral" variant="outline" :loading="pending" @click="onSearch" />
            </div>

            <UTable :data="data.list" :columns="columns" :loading="pending">
                <template #username-cell="{ row }">
                    <span class="font-medium">{{ row.original.username }}</span>
                </template>
                <template #nickname-cell="{ row }">
                    {{ row.original.nickname || '-' }}
                </template>
                <template #email-cell="{ row }">
                    {{ row.original.email || '-' }}
                </template>
                <template #status-cell="{ row }">
                    <UBadge
                        :color="row.original.status === 1 ? 'success' : 'error'"
                        variant="subtle"
                        :label="row.original.status === 1 ? '启用' : '禁用'"
                    />
                </template>
                <template #createdAt-cell="{ row }">
                    {{ formatDateTime(row.original.createdAt) }}
                </template>
                <template #actions-cell="{ row }">
                    <UButton
                        size="xs"
                        :color="row.original.status === 1 ? 'error' : 'success'"
                        variant="ghost"
                        :icon="row.original.status === 1 ? 'i-lucide-ban' : 'i-lucide-circle-check'"
                        :label="row.original.status === 1 ? '禁用' : '启用'"
                        :loading="togglingId === row.original.id"
                        @click="toggleStatus(row.original)"
                    />
                </template>
            </UTable>

            <div class="flex items-center justify-between border-t border-default p-4">
                <span class="text-sm text-muted">共 {{ data.total }} 条</span>
                <UPagination v-model:page="page" :total="data.total" :items-per-page="pageSize" />
            </div>
        </UCard>
    </div>
</template>
