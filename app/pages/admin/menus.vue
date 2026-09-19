<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface MenuItem {
    id: number
    parentId: number | null
    label: string
    type: 'link' | 'category' | 'page' | 'post'
    refId: number | null
    url: string
    newTab: boolean
    sort: number
    broken: boolean
    children: MenuItem[]
}

const toast = useToast()
const { data: menus, refresh } = await useFetch<MenuItem[]>('/api/admin/menus', { default: () => [] })

// 关联内容选项
const { data: categories } = await useFetch<{ id: number; name: string }[]>('/api/admin/categories', { default: () => [] })
const { data: pages } = await useFetch<{ id: number; title: string }[]>('/api/admin/pages', { default: () => [] })
const { data: postsData } = await useFetch<{ list: { id: number; title: string }[] }>('/api/admin/posts', {
    query: { page: 1, pageSize: 100 },
    default: () => ({ list: [] }),
})

const typeItems = [
    { label: '自定义链接', value: 'link' },
    { label: '文章分类', value: 'category' },
    { label: '单页', value: 'page' },
    { label: '文章', value: 'post' },
]
const typeLabel: Record<string, string> = { link: '链接', category: '分类', page: '单页', post: '文章' }

const refItems = computed(() => {
    if (form.type === 'category') return (categories.value ?? []).map(c => ({ label: c.name, value: c.id }))
    if (form.type === 'page') return (pages.value ?? []).map(p => ({ label: p.title, value: p.id }))
    if (form.type === 'post') return (postsData.value.list ?? []).map(p => ({ label: p.title, value: p.id }))
    return []
})

// 新建/编辑弹窗
const editOpen = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const editingParentId = ref<number | null>(null)
const form = reactive({
    label: '',
    type: 'link' as MenuItem['type'],
    refId: undefined as number | undefined,
    url: '',
    newTab: false,
    sort: 0,
})

function openCreate(parentId: number | null) {
    editingId.value = null
    editingParentId.value = parentId
    Object.assign(form, { label: '', type: 'link', refId: undefined, url: '', newTab: false, sort: 0 })
    editOpen.value = true
}

function openEdit(item: MenuItem) {
    editingId.value = item.id
    editingParentId.value = item.parentId
    Object.assign(form, {
        label: item.label,
        type: item.type,
        refId: item.refId ?? undefined,
        url: item.url || '',
        newTab: item.newTab,
        sort: item.sort,
    })
    editOpen.value = true
}

async function save() {
    saving.value = true
    try {
        const body = {
            label: form.label,
            type: form.type,
            refId: form.type === 'link' ? undefined : form.refId,
            url: form.type === 'link' ? form.url : undefined,
            newTab: form.newTab,
            sort: form.sort,
            parentId: editingParentId.value ?? undefined,
        }
        if (editingId.value) {
            await $fetch(`/api/admin/menus/${editingId.value}`, { method: 'PUT', body })
        } else {
            await $fetch('/api/admin/menus', { method: 'POST', body })
        }
        toast.add({ title: '已保存', color: 'success' })
        editOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
    } finally {
        saving.value = false
    }
}

// 删除
const deleteTarget = ref<MenuItem | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: MenuItem) {
    deleteTarget.value = item
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await $fetch(`/api/admin/menus/${deleteTarget.value.id}`, { method: 'DELETE' })
        toast.add({ title: '已删除', color: 'success' })
        deleteOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '删除失败', description: errorMessage(e), color: 'error' })
    } finally {
        deleting.value = false
    }
}

// 上移/下移：与同级相邻项交换 sort
async function move(item: MenuItem, siblings: MenuItem[], dir: -1 | 1) {
    const idx = siblings.findIndex(s => s.id === item.id)
    const other = siblings[idx + dir]
    if (!other) return
    try {
        await $fetch(`/api/admin/menus/${item.id}`, { method: 'PUT', body: { sort: other.sort } })
        await $fetch(`/api/admin/menus/${other.id}`, { method: 'PUT', body: { sort: item.sort } })
        await refresh()
    } catch (e) {
        toast.add({ title: '排序失败', description: errorMessage(e), color: 'error' })
    }
}
</script>

<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold">菜单管理</h1>
                <p class="mt-1 text-sm text-muted">自定义前台导航，支持两级；页头模板中通过 nav 变量循环渲染</p>
            </div>
            <UButton icon="i-lucide-plus" label="新建一级菜单" @click="openCreate(null)" />
        </div>

        <div v-if="menus.length" class="space-y-3">
            <UCard v-for="item in menus" :key="item.id" :ui="{ body: 'p-4 sm:p-4' }">
                <!-- 一级菜单 -->
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-grip-vertical" class="size-4 text-muted" />
                    <span class="font-medium">{{ item.label }}</span>
                    <UBadge color="neutral" variant="subtle" :label="typeLabel[item.type]" />
                    <UBadge v-if="item.broken" color="error" variant="subtle" label="链接失效" />
                    <span class="truncate text-xs text-muted">{{ item.url }}</span>
                    <UBadge v-if="item.newTab" color="neutral" variant="outline" label="新窗口" />
                    <div class="ml-auto flex items-center gap-1">
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-up" @click="move(item, menus, -1)" />
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-down" @click="move(item, menus, 1)" />
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-plus" label="子菜单" @click="openCreate(item.id)" />
                        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(item)" />
                        <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="askDelete(item)" />
                    </div>
                </div>

                <!-- 二级菜单 -->
                <div v-if="item.children.length" class="mt-3 space-y-2 border-t border-default pt-3">
                    <div
                        v-for="child in item.children"
                        :key="child.id"
                        class="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2"
                    >
                        <UIcon name="i-lucide-corner-down-right" class="size-4 text-muted" />
                        <span class="text-sm">{{ child.label }}</span>
                        <UBadge color="neutral" variant="subtle" size="sm" :label="typeLabel[child.type]" />
                        <UBadge v-if="child.broken" color="error" variant="subtle" size="sm" label="链接失效" />
                        <span class="truncate text-xs text-muted">{{ child.url }}</span>
                        <UBadge v-if="child.newTab" color="neutral" variant="outline" size="sm" label="新窗口" />
                        <div class="ml-auto flex items-center gap-1">
                            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-up" @click="move(child, item.children, -1)" />
                            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-arrow-down" @click="move(child, item.children, 1)" />
                            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-pencil" @click="openEdit(child)" />
                            <UButton size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" @click="askDelete(child)" />
                        </div>
                    </div>
                </div>
            </UCard>
        </div>

        <div v-else class="rounded-lg border border-dashed border-default py-16 text-center text-muted">
            暂无菜单，点击右上角「新建一级菜单」
        </div>

        <!-- 新建/编辑弹窗 -->
        <UModal v-model:open="editOpen" :title="editingId ? '编辑菜单' : (editingParentId ? '新建子菜单' : '新建一级菜单')">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="菜单名称" required>
                        <UInput v-model="form.label" placeholder="如：产品中心" class="w-full" />
                    </UFormField>
                    <UFormField label="类型" required>
                        <USelect v-model="form.type" :items="typeItems" class="w-full" @update:model-value="form.refId = undefined" />
                    </UFormField>
                    <UFormField v-if="form.type !== 'link'" label="选择内容" required>
                        <USelect
                            v-model="form.refId"
                            :items="refItems"
                            :placeholder="form.type === 'category' ? '选择分类' : form.type === 'page' ? '选择单页' : '选择文章'"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField v-else label="链接地址" required>
                        <UInput v-model="form.url" placeholder="如 /news 或 https://example.com" class="w-full" />
                    </UFormField>
                    <UFormField label="排序（数字越小越靠前）">
                        <UInput v-model.number="form.sort" type="number" class="w-32" />
                    </UFormField>
                    <UFormField label="新窗口打开">
                        <USwitch v-model="form.newTab" />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton color="neutral" variant="ghost" label="取消" :disabled="saving" @click="editOpen = false" />
                    <UButton label="保存" :loading="saving" @click="save" />
                </div>
            </template>
        </UModal>

        <AdminConfirmModal
            v-model:open="deleteOpen"
            title="删除菜单"
            :description="`确定删除菜单「${deleteTarget?.label}」吗？${deleteTarget?.children.length ? '其子菜单将一并删除。' : ''}`"
            :loading="deleting"
            @confirm="confirmDelete"
        />
    </div>
</template>
