<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Page {
    id: number
    title: string
    slug: string
    status: 'draft' | 'published'
    updatedAt: string
}

const toast = useToast()
const { data, pending, refresh } = await useFetch<Page[]>('/api/admin/pages', { default: () => [] })

const columns = [
    { accessorKey: 'title', header: '标题' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'status', header: '状态' },
    { accessorKey: 'updatedAt', header: '更新时间' },
    { id: 'actions', header: '操作' },
]

const statusItems = [
    { label: '草稿', value: 'draft' },
    { label: '发布', value: 'published' },
]

// 新建 / 编辑
const modalOpen = ref(false)
const saving = ref(false)
const loadingDetail = ref(false)
const editing = ref<Page | null>(null)
const form = reactive({ title: '', slug: '', content: '', status: 'draft' as 'draft' | 'published' })
// 编辑时若详情接口不可用，content 留空表示不修改原内容
let contentLoaded = false

function openCreate() {
    editing.value = null
    form.title = ''
    form.slug = ''
    form.content = ''
    form.status = 'draft'
    contentLoaded = true
    modalOpen.value = true
}

async function openEdit(item: Page) {
    editing.value = item
    form.title = item.title
    form.slug = item.slug
    form.content = ''
    form.status = item.status === 'published' ? 'published' : 'draft'
    contentLoaded = false
    modalOpen.value = true
    loadingDetail.value = true
    try {
        const detail = await $fetch<Record<string, any>>(`/api/admin/pages/${item.id}`)
        form.title = detail.title ?? form.title
        form.slug = detail.slug ?? form.slug
        form.content = detail.content ?? ''
        form.status = detail.status === 'published' ? 'published' : 'draft'
        contentLoaded = true
    } catch {
        // 列表接口不含 content，若详情接口不存在则保留空内容（保存时不下发 content 字段）
    } finally {
        loadingDetail.value = false
    }
}

async function onSubmit() {
    if (!form.title.trim()) {
        toast.add({ title: '请填写页面标题', color: 'warning' })
        return
    }
    saving.value = true
    const body: Record<string, unknown> = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        status: form.status,
    }
    if (contentLoaded || form.content) {
        body.content = form.content
    }
    try {
        if (editing.value) {
            await $fetch(`/api/admin/pages/${editing.value.id}`, { method: 'PUT', body })
        } else {
            await $fetch('/api/admin/pages', { method: 'POST', body })
        }
        toast.add({ title: editing.value ? '页面已更新' : '页面已创建', color: 'success' })
        modalOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
    } finally {
        saving.value = false
    }
}

// 删除
const deleteTarget = ref<Page | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: Page) {
    deleteTarget.value = item
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await $fetch(`/api/admin/pages/${deleteTarget.value.id}`, { method: 'DELETE' })
        toast.add({ title: '页面已删除', color: 'success' })
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
                <h1 class="text-xl font-semibold">页面管理</h1>
                <p class="mt-1 text-sm text-muted">关于我们、联系我们等独立单页</p>
            </div>
            <UButton icon="i-lucide-plus" label="新建页面" @click="openCreate" />
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="data" :columns="columns" :loading="pending">
                <template #title-cell="{ row }">
                    <span class="font-medium">{{ row.original.title }}</span>
                </template>
                <template #status-cell="{ row }">
                    <UBadge
                        :color="row.original.status === 'published' ? 'success' : 'neutral'"
                        variant="subtle"
                        :label="row.original.status === 'published' ? '已发布' : '草稿'"
                    />
                </template>
                <template #updatedAt-cell="{ row }">
                    {{ formatDateTime(row.original.updatedAt) }}
                </template>
                <template #actions-cell="{ row }">
                    <div class="flex gap-1">
                        <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-pencil"
                            label="编辑"
                            @click="openEdit(row.original)"
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
        </UCard>

        <UModal v-model:open="modalOpen" :title="editing ? '编辑页面' : '新建页面'" class="sm:max-w-2xl">
            <template #body>
                <div v-if="loadingDetail" class="flex justify-center py-10">
                    <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted" />
                </div>
                <div v-else class="space-y-4">
                    <UFormField label="标题" required>
                        <UInput v-model="form.title" placeholder="请输入页面标题" class="w-full" />
                    </UFormField>
                    <div class="grid grid-cols-2 gap-4">
                        <UFormField label="Slug" hint="留空将由系统自动生成">
                            <UInput v-model="form.slug" placeholder="例如 about" class="w-full" />
                        </UFormField>
                        <UFormField label="状态">
                            <USelect v-model="form.status" :items="statusItems" class="w-full" />
                        </UFormField>
                    </div>
                    <UFormField label="内容（Markdown）">
                        <UTextarea
                            v-model="form.content"
                            :rows="12"
                            placeholder="使用 Markdown 语法编写页面内容..."
                            class="w-full font-mono text-sm"
                        />
                    </UFormField>
                    <p v-if="editing && !contentLoaded && !form.content" class="text-xs text-muted">
                        未能加载原页面内容；内容留空保存时将不修改原内容。
                    </p>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        label="取消"
                        :disabled="saving"
                        @click="modalOpen = false"
                    />
                    <UButton label="保存" :loading="saving" :disabled="loadingDetail" @click="onSubmit" />
                </div>
            </template>
        </UModal>

        <AdminConfirmModal
            v-model:open="deleteOpen"
            title="删除页面"
            :description="`确定删除页面「${deleteTarget?.title}」吗？此操作不可恢复。`"
            :loading="deleting"
            @confirm="confirmDelete"
        />
    </div>
</template>
