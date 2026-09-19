<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const toast = useToast()

const form = reactive({
    siteName: '',
    logo: '',
    seoKeywords: '',
    seoDescription: '',
    icp: '',
    phone: '',
    email: '',
    address: '',
    about: '',
})

const { data, pending } = await useFetch<Record<string, any>>('/api/admin/settings')

watch(
    data,
    (v) => {
        if (!v) return
        for (const key of Object.keys(form) as (keyof typeof form)[]) {
            if (v[key] != null) form[key] = String(v[key])
        }
    },
    { immediate: true },
)

const saving = ref(false)

async function onSubmit() {
    saving.value = true
    try {
        await $fetch('/api/admin/settings', { method: 'PUT', body: { ...form } })
        toast.add({ title: '站点设置已保存', color: 'success' })
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
            <div>
                <h1 class="text-xl font-semibold">站点设置</h1>
                <p class="mt-1 text-sm text-muted">网站基础信息、SEO 与联系方式</p>
            </div>
            <UButton label="保存设置" icon="i-lucide-save" :loading="saving" @click="onSubmit" />
        </div>

        <div v-if="pending" class="flex justify-center py-20">
            <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>

        <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <UCard>
                <template #header>
                    <span class="font-medium">基础信息</span>
                </template>
                <div class="space-y-4">
                    <UFormField label="站点名称">
                        <UInput v-model="form.siteName" placeholder="例如：某某科技有限公司" class="w-full" />
                    </UFormField>
                    <UFormField label="站点 LOGO">
                        <AdminImageUpload v-model="form.logo" />
                    </UFormField>
                    <UFormField label="备案号">
                        <UInput v-model="form.icp" placeholder="例如：京ICP备xxxxxxxx号" class="w-full" />
                    </UFormField>
                    <UFormField label="关于我们简介">
                        <UTextarea
                            v-model="form.about"
                            :rows="5"
                            placeholder="企业简介，将展示在网站关于我们等区域"
                            class="w-full"
                        />
                    </UFormField>
                </div>
            </UCard>

            <div class="space-y-4">
                <UCard>
                    <template #header>
                        <span class="font-medium">SEO 设置</span>
                    </template>
                    <div class="space-y-4">
                        <UFormField label="SEO 关键词" hint="多个关键词用英文逗号分隔">
                            <UInput
                                v-model="form.seoKeywords"
                                placeholder="例如：企业管理,内容管理系统"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="SEO 描述">
                            <UTextarea
                                v-model="form.seoDescription"
                                :rows="3"
                                placeholder="网站描述，用于搜索引擎展示"
                                class="w-full"
                            />
                        </UFormField>
                    </div>
                </UCard>

                <UCard>
                    <template #header>
                        <span class="font-medium">联系方式</span>
                    </template>
                    <div class="space-y-4">
                        <UFormField label="联系电话">
                            <UInput v-model="form.phone" placeholder="例如：400-000-0000" class="w-full" />
                        </UFormField>
                        <UFormField label="邮箱">
                            <UInput
                                v-model="form.email"
                                type="email"
                                placeholder="例如：contact@example.com"
                                class="w-full"
                            />
                        </UFormField>
                        <UFormField label="地址">
                            <UInput v-model="form.address" placeholder="公司地址" class="w-full" />
                        </UFormField>
                    </div>
                </UCard>
            </div>
        </div>
    </div>
</template>
