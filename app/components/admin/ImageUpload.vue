<script setup lang="ts">
/** 图片上传字段：v-model 绑定上传后返回的图片路径，含预览与手动输入 */
const model = defineModel<string>({ default: '' })

const toast = useToast()
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const pickerOpen = ref(false)

async function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploading.value = true
    try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await $fetch<{ id: number; path: string; filename: string }>('/api/admin/upload', {
            method: 'POST',
            body: fd,
        })
        model.value = res.path
        toast.add({ title: '上传成功', color: 'success' })
    } catch (err) {
        toast.add({ title: '上传失败', description: errorMessage(err), color: 'error' })
    } finally {
        uploading.value = false
        input.value = ''
    }
}
</script>

<template>
    <div class="flex items-start gap-3">
        <div v-if="model" class="shrink-0">
            <img :src="model" alt="预览" class="h-20 w-32 rounded-lg border border-default object-cover" />
        </div>
        <UInput v-model="model" placeholder="图片路径，如 /uploads/xxx.jpg" class="flex-1" />
        <UButton
            icon="i-lucide-image"
            label="媒体库"
            color="neutral"
            variant="outline"
            @click="pickerOpen = true"
        />
        <UButton
            icon="i-lucide-upload"
            label="上传"
            color="neutral"
            variant="outline"
            :loading="uploading"
            @click="fileInput?.click()"
        />
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <AdminMediaPicker v-model:open="pickerOpen" @select="model = $event" />
    </div>
</template>
