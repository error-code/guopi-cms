interface AdminUser {
    id: number
    username: string
    nickname: string
}

/** 当前登录管理员状态 + 登录/退出/获取信息方法 */
export function useAdminAuth() {
    const user = useState<AdminUser | null>('admin-user', () => null)
    // SSR 下自动转发 cookie；客户端退化为普通 $fetch
    const requestFetch = useRequestFetch()

    async function fetchMe(): Promise<AdminUser | null> {
        try {
            const res = await requestFetch<{ user: AdminUser }>('/api/auth/me')
            user.value = res.user
            return res.user
        } catch {
            user.value = null
            return null
        }
    }

    async function login(username: string, password: string): Promise<AdminUser> {
        const res = await $fetch<{ user: AdminUser }>('/api/auth/login', {
            method: 'POST',
            body: { username, password },
        })
        user.value = res.user
        return res.user
    }

    async function logout(): Promise<void> {
        try {
            await $fetch('/api/auth/logout', { method: 'POST' })
        } catch {
            // 忽略退出接口异常，仍清理本地状态
        }
        user.value = null
        await navigateTo('/admin/login')
    }

    return { user, fetchMe, login, logout }
}
