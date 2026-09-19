<script setup lang="ts">
/** 媒体库选择弹窗：从已上传的媒体中选择图片 */
const emit = defineEmits<{ select: [path: string] }>()
const open = defineModel<boolean>('open', { default: false })

interface MediaItem {
    id: number
    filename: string
    path: string
    mime?: string
    size?: number
    createdAt: string
}

const page = ref(1)
const pageSize = 12
const selected = ref<string>('')

const { data, pending, refresh } = await useFetch<{ list: MediaItem[]; total: number }>('/api/admin/media', {
    query: { page, pageSize },
    default: () => ({ list: [], total: 0 }),
})

const images = computed(() => (data.value.list ?? []).filter(m => (m.mime || '').startsWith('image/')))

watch(open, (v) => {
    if (v) {
        selected.value = ''
        refresh()
    }
})

function confirm() {
    if (!selected.value) return
    emit('select', selected.value)
    open.value = false
}
</script>

<template>
    <UModal v-model:open="open" title="从媒体库选择" class="sm:max-w-3xl">
        <template #body>
            <div v-if="pending" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <USkeleton v-for="i in 8" :key="i" class="aspect-[4/3] rounded-xl" />
            </div>

            <div v-else-if="images.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <button
                    v-for="item in images"
                    :key="item.id"
                    type="button"
                    class="group relative overflow-hidden rounded-xl border-2 transition-all"
                    :class="selected === item.path
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-transparent hover:border-primary/50'"
                    :title="item.filename"
                    @click="selected = item.path"
                    @dblclick="selected = item.path; confirm()"
                >
                    <img :src="item.path" :alt="item.filename" class="aspect-[4/3] w-full bg-elevated object-cover" />
                    <!-- 悬停遮罩 -->
                    <div
                        class="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity"
                        :class="selected === item.path ? 'opacity-100' : 'group-hover:opacity-100'"
                    >
                        <UIcon
                            :name="selected === item.path ? 'i-lucide-circle-check' : 'i-lucide-mouse-pointer-click'"
                            class="size-8 text-white"
                        />
                    </div>
                    <!-- 文件名条 -->
                    <div class="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-left text-xs text-white">
                        {{ item.filename }}
                    </div>
                </button>
            </div>

            <div v-else class="flex flex-col items-center py-14 text-muted">
                <UIcon name="i-lucide-image-off" class="size-12 text-gray-300" />
                <p class="mt-3 text-sm">媒体库暂无图片，请先在媒体库上传</p>
            </div>

            <div v-if="data.total > pageSize" class="mt-5 flex justify-center">
                <UPagination v-model:page="page" :total="data.total" :items-per-page="pageSize" />
            </div>
        </template>

        <template #footer>
            <div class="flex w-full items-center justify-between">
                <span class="truncate text-xs text-muted">
                    {{ selected ? `已选择：${selected}` : '单击选中，双击直接选用' }}
                </span>
                <div class="flex gap-2">
                    <UButton color="neutral" variant="ghost" label="取消" @click="open = false" />
                    <UButton label="使用此图片" icon="i-lucide-check" :disabled="!selected" @click="confirm" />
                </div>
            </div>
        </template>
    </UModal>
</template>
