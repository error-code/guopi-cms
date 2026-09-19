<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Category {
    id: number
    name: string
    slug: string
    sort: number
    postCount: number
}

const toast = useToast()
const { data, pending, refresh } = await useFetch<Category[]>('/api/admin/categories', { default: () => [] })

const columns = [
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'sort', header: '排序' },
    { accessorKey: 'postCount', header: '文章数' },
    { id: 'actions', header: '操作' },
]

// 新建 / 编辑
const modalOpen = ref(false)
const saving = ref(false)
const editing = ref<Category | null>(null)
const form = reactive({ name: '', slug: '', sort: 0 })

function openCreate() {
    editing.value = null
    form.name = ''
    form.slug = ''
    form.sort = 0
    modalOpen.value = true
}

function openEdit(item: Category) {
    editing.value = item
    form.name = item.name
    form.slug = item.slug
    form.sort = item.sort ?? 0
    modalOpen.value = true
}

async function onSubmit() {
    if (!form.name.trim()) {
        toast.add({ title: '请填写分类名称', color: 'warning' })
        return
    }
    saving.value = true
    const body = { name: form.name.trim(), slug: form.slug.trim() || undefined, sort: Number(form.sort) || 0 }
    try {
        if (editing.value) {
            await $fetch(`/api/admin/categories/${editing.value.id}`, { method: 'PUT', body })
        } else {
            await $fetch('/api/admin/categories', { method: 'POST', body })
        }
        toast.add({ title: editing.value ? '分类已更新' : '分类已创建', color: 'success' })
        modalOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
    } finally {
        saving.value = false
    }
}

// 删除
const deleteTarget = ref<Category | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: Category) {
    deleteTarget.value = item
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await $fetch(`/api/admin/categories/${deleteTarget.value.id}`, { method: 'DELETE' })
        toast.add({ title: '分类已删除', color: 'success' })
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
                <h1 class="text-xl font-semibold">分类管理</h1>
                <p class="mt-1 text-sm text-muted">共 {{ data.length }} 个分类</p>
            </div>
            <UButton icon="i-lucide-plus" label="新建分类" @click="openCreate" />
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

        <UModal v-model:open="modalOpen" :title="editing ? '编辑分类' : '新建分类'">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="名称" required>
                        <UInput v-model="form.name" placeholder="请输入分类名称" class="w-full" />
                    </UFormField>
                    <UFormField label="Slug" hint="留空将由系统自动生成">
                        <UInput v-model="form.slug" placeholder="例如 news" class="w-full" />
                    </UFormField>
                    <UFormField label="排序" hint="数字越小越靠前">
                        <UInput v-model.number="form.sort" type="number" class="w-full" />
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
            title="删除分类"
            :description="`确定删除分类「${deleteTarget?.name}」吗？`"
            :loading="deleting"
            @confirm="confirmDelete"
        />
    </div>
</template>
