<script setup lang="ts">
const { register } = useUserAuth()

const form = reactive({
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
})
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
    errorMsg.value = ''
    if (!form.username.trim()) {
        errorMsg.value = '请输入用户名'
        return
    }
    if (form.password.length < 6) {
        errorMsg.value = '密码长度不能少于 6 位'
        return
    }
    if (form.password !== form.confirmPassword) {
        errorMsg.value = '两次输入的密码不一致'
        return
    }
    loading.value = true
    try {
        await register({
            username: form.username.trim(),
            password: form.password,
            nickname: form.nickname.trim() || undefined,
            email: form.email.trim() || undefined,
        })
        await navigateTo('/')
    } catch (e: any) {
        errorMsg.value = e?.data?.message || e?.statusMessage || '注册失败，请稍后重试'
    } finally {
        loading.value = false
    }
}

useSeoMeta({
    title: '会员注册',
})
</script>

<template>
    <div class="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12">
        <UCard class="w-full max-w-md">
            <template #header>
                <h1 class="text-center text-xl font-bold text-gray-900 dark:text-white">会员注册</h1>
            </template>

            <form class="space-y-5" @submit.prevent="onSubmit">
                <UAlert v-if="errorMsg" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="errorMsg" />

                <UFormField label="用户名" required>
                    <UInput v-model="form.username" placeholder="请输入用户名" size="lg" class="w-full" autofocus />
                </UFormField>

                <UFormField label="昵称">
                    <UInput v-model="form.nickname" placeholder="选填，默认为用户名" size="lg" class="w-full" />
                </UFormField>

                <UFormField label="邮箱">
                    <UInput v-model="form.email" type="email" placeholder="选填" size="lg" class="w-full" />
                </UFormField>

                <UFormField label="密码" required>
                    <UInput v-model="form.password" type="password" placeholder="至少 6 位" size="lg" class="w-full" />
                </UFormField>

                <UFormField label="确认密码" required>
                    <UInput
                        v-model="form.confirmPassword"
                        type="password"
                        placeholder="再次输入密码"
                        size="lg"
                        class="w-full"
                    />
                </UFormField>

                <UButton type="submit" color="primary" size="lg" block :loading="loading"> 注 册 </UButton>
            </form>

            <template #footer>
                <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                    已有账号？
                    <NuxtLink to="/user/login" class="text-blue-600 hover:underline">直接登录</NuxtLink>
                </p>
            </template>
        </UCard>
    </div>
</template>
