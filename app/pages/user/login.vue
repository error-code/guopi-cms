<script setup lang="ts">
const { login } = useUserAuth()

const form = reactive({
    username: '',
    password: '',
})
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
    errorMsg.value = ''
    if (!form.username.trim() || !form.password) {
        errorMsg.value = '请输入用户名和密码'
        return
    }
    loading.value = true
    try {
        await login(form.username.trim(), form.password)
        await navigateTo('/')
    } catch (e: any) {
        errorMsg.value = e?.data?.message || e?.statusMessage || '用户名或密码错误'
    } finally {
        loading.value = false
    }
}

useSeoMeta({
    title: '会员登录',
})
</script>

<template>
    <div class="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
        <UCard class="w-full max-w-md">
            <template #header>
                <h1 class="text-center text-xl font-bold text-gray-900 dark:text-white">会员登录</h1>
            </template>

            <form class="space-y-5" @submit.prevent="onSubmit">
                <UAlert v-if="errorMsg" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMsg" />

                <UFormField label="用户名" required>
                    <UInput v-model="form.username" placeholder="请输入用户名" size="lg" class="w-full" autofocus />
                </UFormField>

                <UFormField label="密码" required>
                    <UInput v-model="form.password" type="password" placeholder="请输入密码" size="lg" class="w-full" />
                </UFormField>

                <UButton type="submit" color="primary" size="lg" block :loading="loading"> 登 录 </UButton>
            </form>

            <template #footer>
                <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                    还没有账号？
                    <NuxtLink to="/user/register" class="text-blue-600 hover:underline">立即注册</NuxtLink>
                </p>
            </template>
        </UCard>
    </div>
</template>
