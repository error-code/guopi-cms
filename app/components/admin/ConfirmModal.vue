<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

withDefaults(
    defineProps<{
        title?: string
        description?: string
        confirmLabel?: string
        loading?: boolean
    }>(),
    {
        title: '确认操作',
        description: '此操作不可恢复，确定继续吗？',
        confirmLabel: '确认删除',
        loading: false,
    },
)

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
    <UModal v-model:open="open" :title="title">
        <template #body>
            <p class="text-sm text-muted">
                {{ description }}
            </p>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="ghost" label="取消" :disabled="loading" @click="open = false" />
                <UButton color="error" :label="confirmLabel" :loading="loading" @click="emit('confirm')" />
            </div>
        </template>
    </UModal>
</template>
