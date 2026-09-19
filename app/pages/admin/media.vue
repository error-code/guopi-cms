<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Media {
    id: number
    filename: string
    path: string
    mime: string
    size: number
    createdAt: string
}

const toast = useToast()

const page = ref(1)
const pageSize = 20
const query = computed(() => ({ page: page.value, pageSize }))
const { data, pending, refresh } = await useFetch<{ list: Media[]; total: number }>('/api/admin/media', {
    query,
    default: () => ({ list: [], total: 0 }),
})

function isImage(item: Media) {
    return !!item.mime && item.mime.startsWith('image/')
}

// 上传
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    if (!files.length) return
    uploading.value = true
    let success = 0
    let failed = 0
    for (const file of files) {
        try {
            const fd = new FormData()
            fd.append('file', file)
            await $fetch('/api/admin/upload', { method: 'POST', body: fd })
            success++
        } catch {
            failed++
        }
    }
    uploading.value = false
    input.value = ''
    if (success) toast.add({ title: `成功上传 ${success} 个文件`, color: 'success' })
    if (failed) toast.add({ title: `${failed} 个文件上传失败`, color: 'error' })
    await refresh()
}

// 复制路径
async function copyPath(item: Media) {
    try {
        await navigator.clipboard.writeText(item.path)
        toast.add({ title: '路径已复制', description: item.path, color: 'success' })
    } catch {
        toast.add({ title: '复制失败，请手动复制', description: item.path, color: 'error' })
    }
}

// 删除
const deleteTarget = ref<Media | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: Media) {
    deleteTarget.value = item
    deleteOpen.value = true
}

async function confirmDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await $fetch(`/api/admin/media/${deleteTarget.value.id}`, { method: 'DELETE' })
        toast.add({ title: '文件已删除', color: 'success' })
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
                <h1 class="text-xl font-semibold">媒体库</h1>
                <p class="mt-1 text-sm text-muted">共 {{ data.total }} 个文件，点击图片可复制路径</p>
            </div>
            <UButton icon="i-lucide-upload" label="上传文件" :loading="uploading" @click="fileInput?.click()" />
            <input ref="fileInput" type="file" multiple class="hidden" @change="onFileChange" />
        </div>

        <div v-if="pending" class="flex justify-center py-20">
            <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>

        <div
            v-else-if="!data.list.length"
            class="flex flex-col items-center justify-center rounded-xl border border-dashed border-default py-20 text-muted"
        >
            <UIcon name="i-lucide-image-off" class="mb-3 size-10" />
            <p>暂无媒体文件，点击右上角上传</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <UCard v-for="item in data.list" :key="item.id" :ui="{ body: 'p-2 sm:p-2' }">
                <button
                    type="button"
                    class="group flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-muted/50"
                    :title="`点击复制路径：${item.path}`"
                    @click="copyPath(item)"
                >
                    <img
                        v-if="isImage(item)"
                        :src="item.path"
                        :alt="item.filename"
                        class="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                    />
                    <div v-else class="flex flex-col items-center gap-2 p-2 text-muted">
                        <UIcon name="i-lucide-file" class="size-10" />
                        <span class="w-full truncate text-center text-xs">{{ item.filename }}</span>
                    </div>
                </button>
                <div class="mt-2 flex items-center justify-between gap-1 px-1">
                    <div class="min-w-0">
                        <div class="truncate text-xs font-medium" :title="item.filename">
                            {{ item.filename }}
                        </div>
                        <div class="text-xs text-muted">
                            {{ formatFileSize(item.size) }}
                        </div>
                    </div>
                    <div class="flex shrink-0">
                        <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-lucide-copy"
                            title="复制路径"
                            @click="copyPath(item)"
                        />
                        <UButton
                            size="xs"
                            color="error"
                            variant="ghost"
                            icon="i-lucide-trash-2"
                            title="删除"
                            @click="askDelete(item)"
                        />
                    </div>
                </div>
            </UCard>
        </div>

        <div v-if="data.total > pageSize" class="mt-6 flex justify-center">
            <UPagination v-model:page="page" :total="data.total" :items-per-page="pageSize" />
        </div>

        <AdminConfirmModal
            v-model:open="deleteOpen"
            title="删除文件"
            :description="`确定删除文件「${deleteTarget?.filename}」吗？引用该文件的内容将无法正常显示。`"
            :loading="deleting"
            @confirm="confirmDelete"
        />
    </div>
</template>
