<template>
    <card-container class="card-container">
        <div class="mb-12">数据源</div>
        <el-form-item label="来源类型">
            <el-radio-group v-model="source.type">
                <el-radio value="manual">手动数据</el-radio>
                <el-radio value="business">业务数据</el-radio>
                <el-radio value="api">自定义接口</el-radio>
            </el-radio-group>
        </el-form-item>
        <template v-if="source.type === 'business'">
            <el-form-item label="业务类型">
                <el-select v-model="source.businessType" class="w">
                    <el-option
                        v-for="item in businessOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                        :disabled="!allowedBusinessTypes.includes(item.value)"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="分类">
                <el-input v-model="source.query.category" placeholder="为空则不限分类" clearable />
            </el-form-item>
            <el-form-item label="数量">
                <el-input-number v-model="source.query.limit" :min="1" :max="100" controls-position="right" />
            </el-form-item>
            <el-form-item label="排序">
                <el-select v-model="source.query.sort" class="w">
                    <el-option label="最新" value="latest" />
                    <el-option label="默认排序" value="default" />
                </el-select>
            </el-form-item>
            <el-form-item label="指定ID">
                <el-input v-model="idsText" placeholder="多个 ID 用英文逗号分隔" clearable />
            </el-form-item>
        </template>
        <template v-else-if="source.type === 'api'">
            <el-form-item label="接口地址">
                <el-input v-model="source.api.url" placeholder="/api/custom" clearable />
            </el-form-item>
        </template>
    </card-container>
</template>

<script setup lang="ts">
type BusinessType = 'content' | 'activity' | 'product';
type DataSourceType = 'manual' | 'business' | 'api';

type DataSource = {
    type: DataSourceType;
    businessType: BusinessType;
    query: {
        category: string;
        limit: number;
        sort: string;
        ids?: string[];
    };
    api: {
        url: string;
    };
};

const props = withDefaults(
    defineProps<{
        modelValue?: Partial<DataSource>;
        allowedBusinessTypes?: BusinessType[];
        defaultBusinessType?: BusinessType;
    }>(),
    {
        allowedBusinessTypes: () => ['content', 'activity', 'product'],
        defaultBusinessType: 'content',
    }
);

const emit = defineEmits<{
    (e: 'update:modelValue', value: DataSource): void;
}>();

const businessOptions: { label: string; value: BusinessType }[] = [
    { label: '内容', value: 'content' },
    { label: '活动', value: 'activity' },
    { label: '商品', value: 'product' },
];

const allowedBusinessTypes = computed(() => props.allowedBusinessTypes);

const normalize = (value?: Partial<DataSource>): DataSource => ({
    type: value?.type || 'manual',
    businessType: value?.businessType || props.defaultBusinessType,
    query: {
        category: value?.query?.category || '',
        limit: Number(value?.query?.limit || 6),
        sort: value?.query?.sort || 'latest',
        ids: Array.isArray(value?.query?.ids) ? value.query.ids.map(String).filter(Boolean) : [],
    },
    api: {
        url: value?.api?.url || '',
    },
});

const source = reactive<DataSource>(normalize(props.modelValue));
const idsText = ref((source.query.ids || []).join(','));

watch(
    () => props.modelValue,
    (value) => {
        Object.assign(source, normalize(value));
        idsText.value = (source.query.ids || []).join(',');
    },
    { deep: true }
);

watch(
    idsText,
    (value) => {
        source.query.ids = value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
);

watch(
    source,
    (value) => {
        if (!allowedBusinessTypes.value.includes(value.businessType)) {
            value.businessType = allowedBusinessTypes.value[0] || props.defaultBusinessType;
        }
        emit('update:modelValue', normalize(value));
    },
    { deep: true, immediate: true }
);
</script>
