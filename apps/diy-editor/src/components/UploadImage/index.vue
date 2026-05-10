<template>
    <CommonUpload v-model="uploadValue" :limit="1" :size="size" @update:model-value="handleUploadChange" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CommonUpload from '@/components/common/upload/index.vue';

const props = withDefaults(
    defineProps<{
        value?: string;
        size?: number | string;
    }>(),
    {
        value: '',
        size: 72,
    }
);

const emit = defineEmits<{
    'update:value': [value: string];
    change: [value: string];
}>();

const uploadValue = ref<uploadList[]>([]);

watch(
    () => props.value,
    (value) => {
        uploadValue.value = value ? [{ url: value, original: value.split('/').pop() || 'image' }] : [];
    },
    { immediate: true }
);

const handleUploadChange = (value: uploadList[]) => {
    const url = value[0]?.url || '';
    emit('update:value', url);
    emit('change', url);
};
</script>
