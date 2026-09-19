<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface TemplateSlot {
    key: string
    name: string
    description: string
    language: 'handlebars' | 'css'
    variables: string[]
    defaultContent: string
    isDefault: boolean
    content: string
    file: string
}

const toast = useToast()
const { data: slots, refresh } = await useFetch<TemplateSlot[]>('/api/admin/templates', { default: () => [] })

// 编辑弹窗
const editOpen = ref(false)
const saving = ref(false)
const editing = ref<TemplateSlot | null>(null)
const form = reactive({ content: '' })

function openEdit(slot: TemplateSlot) {
    editing.value = slot
    form.content = slot.content
    editOpen.value = true
}

async function save() {
    if (!editing.value) return
    saving.value = true
    try {
        await $fetch(`/api/admin/templates/${editing.value.key}`, {
            method: 'PUT',
            body: { content: form.content },
        })
        toast.add({ title: '模板已保存', color: 'success' })
        editOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
    } finally {
        saving.value = false
    }
}

// 恢复默认
const resetTarget = ref<TemplateSlot | null>(null)
const resetOpen = ref(false)
const resetting = ref(false)

function askReset(slot: TemplateSlot) {
    resetTarget.value = slot
    resetOpen.value = true
}

async function confirmReset() {
    if (!resetTarget.value) return
    resetting.value = true
    try {
        await $fetch(`/api/admin/templates/${resetTarget.value.key}`, { method: 'DELETE' })
        toast.add({ title: '已恢复默认模板', color: 'success' })
        resetOpen.value = false
        await refresh()
    } catch (e) {
        toast.add({ title: '操作失败', description: errorMessage(e), color: 'error' })
    } finally {
        resetting.value = false
    }
}

const slotPages: Record<string, string> = {
    site_header: '所有前台页面',
    site_footer: '所有前台页面',
    global_css: '所有前台页面',
    post_detail: '/news（点进任意文章查看）',
    page_detail: '/page/about',
    home: '/',
    news_list: '/news',
}
</script>

<template>
    <div>
        <div class="mb-6">
            <h1 class="text-xl font-semibold">模板管理</h1>
            <p class="mt-1 text-sm text-muted">
                在线自定义前台页面模板（Handlebars 语法），模板文件即视图：程序始终渲染 templates/ 目录下的对应文件
            </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
            <UCard v-for="slot in slots" :key="slot.key">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="font-semibold">{{ slot.name }}</h2>
                            <UBadge :color="slot.isDefault ? 'neutral' : 'success'" variant="subtle">
                                {{ slot.isDefault ? '默认模板' : '已自定义' }}
                            </UBadge>
                        </div>
                        <p class="mt-1 text-sm text-muted">{{ slot.description }}</p>
                        <p class="mt-1 text-xs text-muted">作用页面：{{ slotPages[slot.key] }}</p>
                        <p class="mt-1 text-xs text-muted">
                            模板文件：<code class="rounded bg-muted px-1 py-0.5 font-mono">{{ slot.file }}</code>
                        </p>
                    </div>
                </div>
                <div class="mt-4 flex gap-2">
                    <UButton size="sm" icon="i-lucide-pencil" label="编辑模板" @click="openEdit(slot)" />
                    <UButton
                        v-if="!slot.isDefault"
                        size="sm"
                        color="neutral"
                        variant="outline"
                        icon="i-lucide-rotate-ccw"
                        label="恢复默认"
                        @click="askReset(slot)"
                    />
                </div>
            </UCard>
        </div>

        <!-- 编辑弹窗 -->
        <UModal v-model:open="editOpen" :title="`编辑模板：${editing?.name ?? ''}`" class="sm:max-w-3xl">
            <template #body>
                <div v-if="editing" class="space-y-4">
                    <UAlert
                        v-if="editing.language === 'handlebars'"
                        color="info"
                        variant="subtle"
                        icon="i-lucide-info"
                        title="Handlebars 语法"
                        description="{{变量}} 转义输出；{{{变量}}} 原样输出 HTML；{{#each 列表}}…{{/each}} 循环；{{#if 值}}…{{/if}} 判断"
                    />
                    <UAlert
                        v-else
                        color="info"
                        variant="subtle"
                        icon="i-lucide-info"
                        title="纯 CSS"
                        description="此处内容不做模板解析，保存后原样注入前台所有页面的 <style> 标签"
                    />
                    <div v-if="editing.variables.length">
                        <div class="mb-1 text-sm font-medium">可用变量</div>
                        <div class="flex flex-wrap gap-1.5">
                            <UBadge
                                v-for="v in editing.variables"
                                :key="v"
                                color="neutral"
                                variant="subtle"
                                :label="v"
                                class="font-mono"
                            />
                        </div>
                    </div>
                    <UFormField
                        :label="editing.language === 'css' ? '样式内容（CSS）' : '模板内容（HTML + Handlebars）'"
                    >
                        <UTextarea
                            v-model="form.content"
                            :rows="16"
                            class="w-full font-mono text-xs"
                            placeholder="留空保存将使用默认模板内容"
                        />
                    </UFormField>
                    <div class="flex justify-end">
                        <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            label="填入默认模板作参考"
                            @click="form.content = editing.defaultContent"
                        />
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        label="取消"
                        :disabled="saving"
                        @click="editOpen = false"
                    />
                    <UButton label="保存" :loading="saving" @click="save" />
                </div>
            </template>
        </UModal>

        <AdminConfirmModal
            v-model:open="resetOpen"
            title="恢复默认渲染"
            :description="`确定把「${resetTarget?.name}」恢复为默认模板吗？当前文件内容将被默认模板覆盖，自定义内容不可恢复。`"
            :loading="resetting"
            @confirm="confirmReset"
        />
    </div>
</template>
