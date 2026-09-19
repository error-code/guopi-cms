<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Tag {
    id: number
    name: string
    slug: string
    postCount: number
}

const toast = useToast()
const { data, pending, refresh } = await useFetch<Tag[]>('/api/admin/tags', { default: () => [] })

const columns = [
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'postCount', header: '文章数' },
    { id: 'actions', header: '操作' },
]

// 新建 / 编辑
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<Tag | null>(null)
const form = reactive({ name: '', slug: '' })

function openCreate() {
    editing.value = null
    form.name = ''
    form.slug = ''
    modalOpen.value = true
}

function openEdit(item: Tag) {
    editing.value = item
    form.name = item.name
    form.slug = item.slug
    modalOpen.value = true
}

async function onSubmit() {
    if (!form.name.trim()) {
        toast.add({ title: '请填写标签名称', color: 'warning' })
        return
    }
    saving.value = true
    const body = { name: form.name.trim(), slug: form.slug.trim() || undefined }
    try {
        if (editing.value) {
            await $fetch(`/api/admin/tags/${editing.value.id}`, { method: 'PUT', body })
        } else {
            await $fetch('/api/admin/tags', { method: 'POST', body })
        }
        toast.add({ title: editing.value ? '标签已更新' : '标签已创建', color: 'success' })
        modalOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
    } finally {
        saving.value = false
    }
}

// 删除
const deleteTarget = ref<Tag | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: Tag) {
    deleteTarget.value = item
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await $fetch(`/api/admin/tags/${deleteTarget.value.id}`, { method: 'DELETE' })
        toast.add({ title: '标签已删除', color: 'success' })
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
                <h1 class="text-xl font-semibold">标签管理</h1>
                <p class="mt-1 text-sm text-muted">共 {{ data.length }} 个标签</p>
            </div>
            <UButton icon="i-lucide-plus" label="新建标签" @click="openCreate" />
        </div>

        <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="data" :columns="columns" :loading="pending">
                <template #name-cell="{ row }">
                    <span class="font-medium">{{ row.original.name }}</span>
                </template>
                <template #postCount-cell="{ row }">
                    {{ row.original.postCount ?? 0 }}
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

        <UModal v-model:open="modalOpen" :title="editing ? '编辑标签' : '新建标签'">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="名称" required>
                        <UInput v-model="form.name" placeholder="请输入标签名称" class="w-full" />
                    </UFormField>
                    <UFormField label="Slug" hint="留空将由系统自动生成">
                        <UInput v-model="form.slug" placeholder="例如 nuxt" class="w-full" />
                    </UFormField>
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
                    <UButton label="保存" :loading="saving" @click="onSubmit" />
                </div>
            </template>
        </UModal>

        <AdminConfirmModal
            v-model:open="deleteOpen"
            title="删除标签"
            :description="`确定删除标签「${deleteTarget?.name}」吗？`"
            :loading="deleting"
            @confirm="confirmDelete"
        />
    </div>
</template>
