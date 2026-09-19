export interface SiteSettings {
    siteName: string
    logo: string
    seoKeywords: string
    seoDescription: string
    icp: string
    phone: string
    email: string
    address: string
    about: string
}

const defaultSettings: SiteSettings = {
    siteName: '企业站点',
    logo: '',
    seoKeywords: '',
    seoDescription: '',
    icp: '',
    phone: '',
    email: '',
    address: '',
    about: '',
}

export function useSiteSettings() {
    const settings = useState<SiteSettings>('site-settings', () => ({ ...defaultSettings }))

    useAsyncData('site-settings', async () => {
        try {
            const data = await $fetch<Partial<SiteSettings>>('/api/settings/public')
            settings.value = { ...defaultSettings, ...data }
        } catch {
            // 接口不可用时保留默认值
        }
        return settings.value
    })

    return settings
}
