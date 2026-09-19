<script setup lang="ts">
const route = useRoute()
const toast = useToast()
const { user, fetchMe, logout } = useAdminAuth()
const settings = useSiteSettings()
const siteName = computed(() => settings.value.siteName || '我的站点')

onMounted(() => {
    if (!user.value) fetchMe()
})

const navItems = [
    { label: '仪表盘', to: '/admin', icon: 'i-lucide-layout-dashboard', exact: true },
    { label: '文章管理', to: '/admin/posts', icon: 'i-lucide-file-text' },
    { label: '分类管理', to: '/admin/categories', icon: 'i-lucide-folder' },
    { label: '标签管理', to: '/admin/tags', icon: 'i-lucide-tags' },
    { label: '页面管理', to: '/admin/pages', icon: 'i-lucide-file' },
    { label: '媒体库', to: '/admin/media', icon: 'i-lucide-image' },
    { label: '菜单管理', to: '/admin/menus', icon: 'i-lucide-navigation' },
    { label: '模板管理', to: '/admin/templates', icon: 'i-lucide-layout-template' },
    { label: '安全日志', to: '/admin/security', icon: 'i-lucide-shield-check' },
    { label: '会员管理', to: '/admin/users', icon: 'i-lucide-users' },
    { label: '站点设置', to: '/admin/settings', icon: 'i-lucide-settings' },
]

const currentNav = computed(() => navItems.find((item) => isActive(item)))
useHead({
    title: computed(() => `${currentNav.value?.label || '管理后台'} - ${siteName.value}`),
})

function isActive(item: { to: string; exact?: boolean }) {
    return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

// 修改密码
const pwdOpen = ref(false)
const pwdLoading = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

function openPwdModal() {
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdOpen.value = true
}

async function submitPassword() {
    if (!pwdForm.oldPassword || !pwdForm.newPassword) {
        toast.add({ title: '请填写完整', color: 'warning' })
        return
    }
    if (pwdForm.newPassword.length < 6) {
        toast.add({ title: '新密码长度至少 6 位', color: 'warning' })
        return
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
        toast.add({ title: '两次输入的新密码不一致', color: 'warning' })
        return
    }
    pwdLoading.value = true
    try {
        await $fetch('/api/auth/password', {
            method: 'POST',
            body: { oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword },
        })
        toast.add({ title: '密码修改成功', color: 'success' })
        pwdOpen.value = false
    } catch (e) {
        toast.add({
            title: errorStatus(e) === 400 ? '旧密码错误' : '修改失败',
            description: errorStatus(e) === 400 ? undefined : errorMessage(e),
            color: 'error',
        })
    } finally {
        pwdLoading.value = false
    }
}

const userMenuItems = [
    [{ label: '修改密码', icon: 'i-lucide-key-round', onSelect: () => openPwdModal() }],
    [{ label: '退出登录', icon: 'i-lucide-log-out', onSelect: () => logout() }],
]
</script>

<template>
    <div class="flex h-screen bg-muted/30">
        <!-- 侧边栏 -->
        <aside class="flex w-56 shrink-0 flex-col bg-gray-900 dark:bg-gray-950">
            <NuxtLink to="/admin" class="flex h-16 items-center gap-2 px-5 text-lg font-semibold text-white">
                <UIcon name="i-lucide-layout-template" class="size-6 shrink-0 text-primary-400" />
                <span class="truncate">{{ siteName }}</span>
            </NuxtLink>
            <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                <NuxtLink
                    v-for="item in navItems"
                    :key="item.to"
                    :to="item.to"
                    class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
                    :class="
                        isActive(item)
                            ? 'bg-white/10 font-medium text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    "
                >
                    <UIcon :name="item.icon" class="size-5 shrink-0" />
                    {{ item.label }}
                </NuxtLink>
            </nav>
            <div class="px-5 py-4 text-xs text-gray-500">
                Powered by
                <a href="https://www.guopi.xin" target="_blank" rel="noopener" class="hover:text-gray-300">果皮CMS</a>
            </div>
        </aside>

        <!-- 主区域 -->
        <div class="flex min-w-0 flex-1 flex-col">
            <header class="flex h-16 shrink-0 items-center justify-between border-b border-default bg-default px-6">
                <div class="text-sm text-muted">欢迎回来，{{ user?.nickname || user?.username || '管理员' }}</div>
                <UDropdownMenu :items="userMenuItems">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        icon="i-lucide-circle-user-round"
                        trailing-icon="i-lucide-chevron-down"
                    >
                        {{ user?.nickname || user?.username || '管理员' }}
                    </UButton>
                </UDropdownMenu>
            </header>

            <main class="min-h-0 flex-1 overflow-y-auto p-6">
                <slot />
            </main>
        </div>

        <!-- 修改密码弹窗 -->
        <UModal v-model:open="pwdOpen" title="修改密码">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="旧密码" required>
                        <UInput
                            v-model="pwdForm.oldPassword"
                            type="password"
                            placeholder="请输入旧密码"
                            class="w-full"
                        />
                    </UFormField>
                    <UFormField label="新密码" required>
                        <UInput v-model="pwdForm.newPassword" type="password" placeholder="至少 6 位" class="w-full" />
                    </UFormField>
                    <UFormField label="确认新密码" required>
                        <UInput
                            v-model="pwdForm.confirmPassword"
                            type="password"
                            placeholder="再次输入新密码"
                            class="w-full"
                            @keyup.enter="submitPassword"
                        />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        label="取消"
                        :disabled="pwdLoading"
                        @click="pwdOpen = false"
                    />
                    <UButton label="确认修改" :loading="pwdLoading" @click="submitPassword" />
                </div>
            </template>
        </UModal>
    </div>
</template>
