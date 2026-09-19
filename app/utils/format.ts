/** 格式化为 'YYYY-MM-DD HH:mm'，空值或非法日期返回 '-' */
export function formatDateTime(input?: string | number | Date | null): string {
    if (!input) return '-'
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return '-'
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 文件大小人性化显示 */
export function formatFileSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let i = 0
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024
        i++
    }
    return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** 从 $fetch 抛出的错误中提取可读信息 */
export function errorMessage(e: unknown, fallback = '操作失败，请稍后重试'): string {
    const err = e as { data?: { message?: string }; statusMessage?: string; message?: string } | null
    return err?.data?.message || err?.statusMessage || err?.message || fallback
}

/** 提取 HTTP 状态码（$fetch / ofetch 错误兼容） */
export function errorStatus(e: unknown): number | undefined {
    const err = e as { statusCode?: number; status?: number; response?: { status?: number } } | null
    return err?.statusCode ?? err?.status ?? err?.response?.status
}
