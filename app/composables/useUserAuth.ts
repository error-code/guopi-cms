export interface SiteUser {
    id: number
    username: string
    nickname: string
}

export interface RegisterPayload {
    username: string
    password: string
    nickname?: string
    email?: string
}

export function useUserAuth() {
    const user = useState<SiteUser | null>('site-user', () => null)
    const fetched = useState<boolean>('site-user-fetched', () => false)

    async function fetchMe() {
        try {
            const res = await $fetch<{ user: SiteUser | null }>('/api/user/me')
            user.value = res.user
        } catch {
            user.value = null
        }
        fetched.value = true
        return user.value
    }

    async function login(username: string, password: string) {
        const res = await $fetch<{ user: SiteUser }>('/api/user/login', {
            method: 'POST',
            body: { username, password },
        })
        user.value = res.user
        fetched.value = true
        return res.user
    }

    async function register(payload: RegisterPayload) {
        const res = await $fetch<{ user: SiteUser }>('/api/user/register', {
            method: 'POST',
            body: payload,
        })
        user.value = res.user
        fetched.value = true
        return res.user
    }

    async function logout() {
        try {
            await $fetch('/api/user/logout', { method: 'POST' })
        } finally {
            user.value = null
        }
    }

    return { user, fetched, fetchMe, login, register, logout }
}
