/** 后台页面登录守卫：未登录（/api/auth/me 返回 401）跳转到登录页 */
export default defineNuxtRouteMiddleware(async () => {
    const { user, fetchMe } = useAdminAuth()
    if (!user.value) {
        await fetchMe()
    }
    if (!user.value) {
        return navigateTo('/admin/login')
    }
})
