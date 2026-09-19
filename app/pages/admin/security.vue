<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SecurityLog {
    id: number
    ip: string
    method: string
    path: string
    userAgent: string
    os: string
    browser: string
    event: string
    detail: string
    createdAt: string
}
interface BlockedIp {
    id: number
    ip: string
    reason: string
    createdAt: string
}
interface Stats {
    todayCount: number
    totalAll: number
    blockedCount: number
    attackCount: number
    topIps: { ip: string; count: number }[]
}

const toast = useToast()

const EVENT_META: Record<string, { label: string; color: 'error' | 'warning' | 'neutral' }> = {
    attack_sql: { label: 'SQL 注入', color: 'error' },
    attack_xss: { label: 'XSS 攻击', color: 'error' },
    attack_path: { label: '路径穿越', color: 'error' },
    login_failed: { label: '登录失败', color: 'warning' },
    login_locked: { label: '登录锁定', color: 'warning' },
    rate_limited: { label: '触发限流', color: 'warning' },
    ip_blocked: { label: '黑名单拦截', color: 'error' },
}
const eventOptions = [
    { label: '全部事件', value: 'all' },
    ...Object.entries(EVENT_META).map(([value, m]) => ({ label: m.label, value })),
]

const page = ref(1)
const pageSize = 20
const eventFilter = ref('all')
const ipInput = ref('')
const ipFilter = ref('')

const query = computed(() => ({
    page: page.value,
    pageSize,
    event: eventFilter.value === 'all' ? undefined : eventFilter.value,
    ip: ipFilter.value || undefined,
}))
const { data, pending, refresh } = await useFetch<{ list: SecurityLog[]; total: number; stats: Stats }>(
    '/api/admin/security/logs',
    {
        query,
        default: () => ({
            list: [],
            total: 0,
            stats: { todayCount: 0, totalAll: 0, blockedCount: 0, attackCount: 0, topIps: [] },
        }),
    },
)

const { data: blockedData, refresh: refreshBlocked } = await useFetch<{ list: BlockedIp[] }>(
    '/api/admin/security/blocked',
    { default: () => ({ list: [] }) },
)

function onSearch() {
    ipFilter.value = ipInput.value.trim()
    page.value = 1
}

const columns = [
    { accessorKey: 'createdAt', header: '时间' },
    { accessorKey: 'ip', header: 'IP' },
    { accessorKey: 'event', header: '事件' },
    { accessorKey: 'path', header: '路径' },
    { accessorKey: 'os', header: '系统' },
    { accessorKey: 'browser', header: '浏览器' },
    { id: 'actions', header: '操作' },
]

// 封禁 / 解封
const newBlockIp = ref('')
const newBlockReason = ref('')
const blocking = ref(false)

async function block(ip: string, reason: string) {
    if (!ip) return
    blocking.value = true
    try {
        await $fetch('/api/admin/security/block', { method: 'POST', body: { ip, reason } })
        toast.add({ title: `已封禁 ${ip}`, color: 'success' })
        newBlockIp.value = ''
        newBlockReason.value = ''
        await Promise.all([refresh(), refreshBlocked()])
    } catch (e) {
        toast.add({ title: '封禁失败', description: errorMessage(e), color: 'error' })
    } finally {
        blocking.value = false
    }
}

async function unblock(ip: string) {
    try {
        await $fetch('/api/admin/security/unblock', { method: 'POST', body: { ip } })
        toast.add({ title: `已解封 ${ip}`, color: 'success' })
        await Promise.all([refresh(), refreshBlocked()])
    } catch (e) {
        toast.add({ title: '解封失败', description: errorMessage(e), color: 'error' })
    }
}

// 清空日志
const clearOpen = ref(false)
const clearing = ref(false)

async function clearLogs() {
    clearing.value = true
    try {
        await $fetch('/api/admin/security/logs', { method: 'DELETE' })
        toast.add({ title: '日志已清空', color: 'success' })
        clearOpen.value = false
        page.value = 1
        await refresh()
    } catch (e) {
        toast.add({ title: '清空失败', description: errorMessage(e), color: 'error' })
    } finally {
        clearing.value = false
    }
}
</script>

<template>
    <div>
        <div class="mb-6 flex items-start justify-between">
            <div>
                <h1 class="text-xl font-semibold">安全日志</h1>
                <p class="mt-1 text-sm text-muted">攻击拦截、登录失败与限流事件记录</p>
            </div>
            <UButton
                label="清空日志"
                color="error"
                variant="outline"
                icon="i-lucide-trash-2"
                @click="clearOpen = true"
            />
        </div>

        <!-- 统计卡片 -->
        <div class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <UCard>
                <p class="text-sm text-muted">今日安全事件</p>
                <p class="mt-1 text-2xl font-semibold">{{ data.stats.todayCount }}</p>
            </UCard>
            <UCard>
                <p class="text-sm text-muted">攻击拦截</p>
                <p class="mt-1 text-2xl font-semibold text-error">{{ data.stats.attackCount }}</p>
            </UCard>
            <UCard>
                <p class="text-sm text-muted">累计事件</p>
                <p class="mt-1 text-2xl font-semibold">{{ data.stats.totalAll }}</p>
            </UCard>
            <UCard>
                <p class="text-sm text-muted">黑名单 IP</p>
                <p class="mt-1 text-2xl font-semibold">{{ data.stats.blockedCount }}</p>
            </UCard>
        </div>

        <!-- 日志列表 -->
        <UCard :ui="{ body: 'p-0 sm:p-0' }" class="mb-6">
            <div class="flex flex-wrap items-center gap-3 border-b border-default p-4">
                <USelect v-model="eventFilter" :items="eventOptions" class="w-40" @update:model-value="page = 1" />
                <UInput
                    v-model="ipInput"
                    icon="i-lucide-search"
                    placeholder="按 IP 搜索"
                    class="w-56"
                    @keyup.enter="onSearch"
                />
                <UButton label="搜索" color="neutral" variant="outline" :loading="pending" @click="onSearch" />
            </div>

            <UTable :data="data.list" :columns="columns" :loading="pending">
                <template #createdAt-cell="{ row }">
                    {{ formatDateTime(row.original.createdAt) }}
                </template>
                <template #ip-cell="{ row }">
                    <span class="font-mono text-sm">{{ row.original.ip }}</span>
                </template>
                <template #event-cell="{ row }">
                    <UBadge
                        :color="EVENT_META[row.original.event]?.color || 'neutral'"
                        variant="subtle"
                        :label="EVENT_META[row.original.event]?.label || row.original.event"
                    />
                </template>
                <template #path-cell="{ row }">
                    <UTooltip :text="row.original.detail || row.original.path">
                        <span class="block max-w-64 truncate font-mono text-xs">{{ row.original.path }}</span>
                    </UTooltip>
                </template>
                <template #os-cell="{ row }">
                    {{ row.original.os }}
                </template>
                <template #browser-cell="{ row }">
                    {{ row.original.browser }}
                </template>
                <template #actions-cell="{ row }">
                    <UButton
                        size="xs"
                        color="error"
                        variant="ghost"
                        icon="i-lucide-shield-ban"
                        label="封禁"
                        @click="
                            block(
                                row.original.ip,
                                `安全日志手动封禁（${EVENT_META[row.original.event]?.label || row.original.event}）`,
                            )
                        "
                    />
                </template>
            </UTable>

            <div class="flex items-center justify-between border-t border-default p-4">
                <span class="text-sm text-muted">共 {{ data.total }} 条</span>
                <UPagination v-model:page="page" :total="data.total" :items-per-page="pageSize" />
            </div>
        </UCard>

        <!-- IP 黑名单 -->
        <UCard>
            <template #header>
                <h2 class="font-semibold">IP 黑名单</h2>
            </template>
            <div class="mb-4 flex flex-wrap items-center gap-3">
                <UInput v-model="newBlockIp" placeholder="要封禁的 IP，如 1.2.3.4" class="w-56" />
                <UInput v-model="newBlockReason" placeholder="封禁原因（可选）" class="w-72" />
                <UButton
                    label="添加封禁"
                    icon="i-lucide-shield-ban"
                    :loading="blocking"
                    @click="block(newBlockIp.trim(), newBlockReason.trim())"
                />
            </div>
            <div v-if="blockedData.list.length" class="divide-y divide-default">
                <div v-for="item in blockedData.list" :key="item.id" class="flex items-center justify-between py-2.5">
                    <div>
                        <span class="font-mono text-sm font-medium">{{ item.ip }}</span>
                        <span v-if="item.reason" class="ml-3 text-sm text-muted">{{ item.reason }}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-xs text-muted">{{ formatDateTime(item.createdAt) }}</span>
                        <UButton size="xs" color="neutral" variant="ghost" label="解封" @click="unblock(item.ip)" />
                    </div>
                </div>
            </div>
            <p v-else class="text-sm text-muted">暂无黑名单 IP</p>
        </UCard>

        <ConfirmModal
            v-model:open="clearOpen"
            title="清空安全日志"
            description="确定要清空全部安全日志吗？此操作不可恢复。"
            confirm-label="清空"
            :loading="clearing"
            @confirm="clearLogs"
        />
    </div>
</template>
