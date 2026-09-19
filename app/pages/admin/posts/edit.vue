<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const route = useRoute()
const toast = useToast()

const id = computed(() => (route.query.id ? Number(route.query.id) : null))
const isEdit = computed(() => !!id.value)

const form = reactive({
    title: '',
    slug: '',
    summary: '',
    content: '',
    cover: '',
    status: 'draft' as 'draft' | 'published',
    isTop: false,
    categoryId: '',
    tagIds: [] as string[],
})
const loading = ref(false)
const saving = ref(false)

const { data: categories } = await useFetch<{ id: number; name: string }[]>('/api/admin/categories', {
    default: () => [],
})
const { data: tags } = await useFetch<{ id: number; name: string }[]>('/api/admin/tags', { default: () => [] })

const categoryItems = computed(() => (categories.value ?? []).map((c) => ({ label: c.name, value: String(c.id) })))
const tagItems = computed(() => (tags.value ?? []).map((t) => ({ label: t.name, value: String(t.id) })))
const statusItems = [
    { label: '草稿', value: 'draft' },
    { label: '发布', value: 'published' },
]

onMounted(async () => {
    if (!id.value) return
    loading.value = true
    try {
        const post = await $fetch<Record<string, any>>(`/api/admin/posts/${id.value}`)
        form.title = post.title ?? ''
        form.slug = post.slug ?? ''
        form.summary = post.summary ?? ''
        form.content = post.content ?? ''
        form.cover = post.cover ?? ''
        form.status = post.status === 'published' ? 'published' : 'draft'
        form.isTop = !!post.isTop
        form.categoryId = post.categoryId ? String(post.categoryId) : ''
        form.tagIds = Array.isArray(post.tagIds) ? post.tagIds.map(String) : []
    } catch (e) {
        toast.add({ title: '加载文章失败', description: errorMessage(e), color: 'error' })
    } finally {
        loading.value = false
    }
})

const previewHtml = computed(() => renderMarkdown(form.content))

async function onSubmit() {
    if (!form.title.trim()) {
        toast.add({ title: '请填写文章标题', color: 'warning' })
        return
    }
    saving.value = true
    const body = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        summary: form.summary || undefined,
        content: form.content || undefined,
        cover: form.cover || undefined,
        status: form.status,
        isTop: form.isTop,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        tagIds: form.tagIds.map(Number),
    }
    try {
        if (isEdit.value) {
            await $fetch(`/api/admin/posts/${id.value}`, { method: 'PUT', body })
        } else {
            await $fetch('/api/admin/posts', { method: 'POST', body })
        }
        toast.add({ title: isEdit.value ? '文章已更新' : '文章已创建', color: 'success' })
        await navigateTo('/admin/posts')
    } catch (e) {
        toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div>
        <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/admin/posts" />
                <h1 class="text-xl font-semibold">
                    {{ isEdit ? '编辑文章' : '新建文章' }}
                </h1>
            </div>
            <div class="flex gap-2">
                <UButton label="返回列表" color="neutral" variant="outline" to="/admin/posts" />
                <UButton label="保存" icon="i-lucide-save" :loading="saving" @click="onSubmit" />
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>

        <template v-else>
            <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <!-- 基本信息 -->
                <UCard class="xl:col-span-2">
                    <div class="space-y-4">
                        <UFormField label="标题" required>
                            <UInput v-model="form.title" placeholder="请输入文章标题" class="w-full" />
                        </UFormField>
                        <UFormField label="Slug" hint="留空将由系统自动生成">
                            <UInput v-model="form.slug" placeholder="例如 hello-world" class="w-full" />
                        </UFormField>
                        <UFormField label="摘要">
                            <UTextarea v-model="form.summary" :rows="3" placeholder="文章摘要（可选）" class="w-full" />
                        </UFormField>
                        <UFormField label="封面图">
                            <AdminImageUpload v-model="form.cover" />
                        </UFormField>
                    </div>
                </UCard>

                <!-- 发布设置 -->
                <UCard>
                    <template #header>
                        <span class="font-medium">发布设置</span>
                    </template>
                    <div class="space-y-4">
                        <UFormField label="状态">
                            <USelect v-model="form.status" :items="statusItems" class="w-full" />
                        </UFormField>
                        <UFormField label="分类">
                            <USelect
                                v-model="form.categoryId"
                                :items="categoryItems"
                                placeholder="请选择分类"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="标签">
                            <USelect
                                v-model="form.tagIds"
                                :items="tagItems"
                                multiple
                                placeholder="请选择标签"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="置顶">
                            <div class="flex items-center gap-2">
                                <USwitch v-model="form.isTop" />
                                <span class="text-sm text-muted">{{ form.isTop ? '已置顶' : '不置顶' }}</span>
                            </div>
                        </UFormField>
                    </div>
                </UCard>
            </div>

            <!-- Markdown 编辑 / 预览 -->
            <UCard class="mt-4">
                <template #header>
                    <span class="font-medium">正文内容（Markdown）</span>
                </template>
                <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <UTextarea
                        v-model="form.content"
                        :rows="22"
                        placeholder="使用 Markdown 语法编写文章内容..."
                        class="w-full font-mono text-sm"
                    />
                    <div class="min-h-120 overflow-auto rounded-lg border border-default p-4">
                        <div
                            v-if="form.content"
                            class="prose prose-sm max-w-none dark:prose-invert"
                            v-html="previewHtml"
                        />
                        <p v-else class="text-sm text-muted">预览区域：左侧输入 Markdown 后此处实时渲染</p>
                    </div>
                </div>
            </UCard>
        </template>
    </div>
</template>
