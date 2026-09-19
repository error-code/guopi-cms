<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAdminAuth()
const settings = useSiteSettings()
const siteName = computed(() => settings.value.siteName || '我的站点')
useHead({ title: computed(() => `管理后台登录 - ${siteName.value}`) })

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
    if (!form.username.trim() || !form.password) {
        errorMsg.value = '请输入用户名和密码'
        return
    }
    loading.value = true
    errorMsg.value = ''
    try {
        await login(form.username.trim(), form.password)
        await navigateTo('/admin')
    } catch (e) {
        errorMsg.value = errorStatus(e) === 401 ? '账号或密码错误' : errorMessage(e, '登录失败，请稍后重试')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <UCard class="w-full max-w-sm">
            <div class="mb-6 text-center">
                <UIcon name="i-lucide-layout-template" class="mx-auto mb-3 size-10 text-primary" />
                <h1 class="text-xl font-semibold">{{ siteName }}</h1>
                <p class="mt-1 text-sm text-muted">管理后台登录</p>
            </div>

            <UAlert
                v-if="errorMsg"
                color="error"
                variant="subtle"
                icon="i-lucide-circle-alert"
                :title="errorMsg"
                class="mb-4"
            />

            <UForm :state="form" class="space-y-4" @submit="onSubmit">
                <UFormField label="用户名" name="username">
                    <UInput
                        v-model="form.username"
                        icon="i-lucide-user"
                        placeholder="请输入用户名"
                        class="w-full"
                        autofocus
                    />
                </UFormField>
                <UFormField label="密码" name="password">
                    <UInput
                        v-model="form.password"
                        type="password"
                        icon="i-lucide-lock"
                        placeholder="请输入密码"
                        class="w-full"
                    />
                </UFormField>
                <UButton type="submit" block size="lg" :loading="loading" label="登 录" />
            </UForm>

            <p class="mt-6 text-center text-xs text-muted">
                Powered by
                <a href="https://www.guopi.xin" target="_blank" rel="noopener" class="hover:text-primary">果皮CMS</a>
            </p>
        </UCard>
    </div>
</template>
