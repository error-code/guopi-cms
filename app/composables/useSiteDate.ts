/** 将日期格式化为 YYYY-MM-DD */
export function formatSiteDate(value?: string | null): string {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}
