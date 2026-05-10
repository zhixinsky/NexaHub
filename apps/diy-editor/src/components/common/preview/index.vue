<template>
    <el-dialog
        v-model="dialog_visible"
        class="diy-preview-dialog radius-lg"
        width="960px"
        :modal="false"
        destroy-on-close
        :close-on-click-modal="false"
        append-to-body
        :z-index="200000"
    >
        <template #header>
            <div class="diy-preview-dialog__title">预览</div>
        </template>
        <div v-show="dialog_visible" class="content-right diy-preview-body">
            <template v-if="iframe_src">
                <iframe :key="iframe_key" :src="iframe_src" class="mobile-iframe" frameborder="0"></iframe>
                <div class="qrcode-content qrcode-card">
                    <div class="qrcode-block">
                        <img
                            v-if="qrcode_data_url"
                            :src="qrcode_data_url"
                            class="qrcode-img-shopxo"
                            width="100"
                            alt="preview-qrcode"
                        />
                        <div v-else class="qrcode-placeholder">二维码生成中…</div>
                    </div>
                    <div class="qrcode-caption qrcode-actions">
                        <span class="caption-muted">内网预览</span>
                        <span v-if="public_link" class="text-copy link-like" @click="copy_link">复制</span>
                        <a v-if="public_link" :href="public_link" target="_blank" rel="noopener noreferrer" class="link-like">查看</a>
                    </div>
                </div>
            </template>
            <template v-else>
                <div class="mobile-iframe mobile-iframe--tips">{{ empty_tips }}</div>
            </template>
        </div>
    </el-dialog>
</template>
<script setup lang="ts">
import { get_cookie, set_cookie, get_math } from '@/utils';
import { commonStore } from '@/store';
import { get_type } from '@/utils/common';
import QRCode from 'qrcode';

const common_store = commonStore();
const props = defineProps({
    dataId: {
        type: String,
        default: '',
    },
});
const dialog_visible = defineModel({ type: Boolean, default: false });

const empty_tips =
    '如需 H5 预览效果，请先配置可用的预览域名或手机端 H5 地址；本地草稿预览需保证当前编辑器可打开 #/preview 路由。';

const copy_link = async () => {
    const text = public_link.value;
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        ElMessage.success('已复制链接');
    } catch {
        ElMessage.error('复制失败，请手动选择链接复制');
    }
};

const new_link = ref('');
const public_link = ref('');
const qrcode_data_url = ref('');
const token = ref('');
const iframe_key = ref(0);

const build_preview_url = (origin: string, uuid: string) => {
    const preview_path = window.location.pathname.startsWith('/diy-editor') ? window.location.pathname : '/diy-editor';
    return `${origin}${preview_path}#/preview?id=${encodeURIComponent(props.dataId)}&draft=1&system_type=default${token.value}&uuid=${uuid}`;
};

const iframe_src = computed(() => {
    const base = String(new_link.value || '');
    if (!base) return '';
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}key=${iframe_key.value}`;
});

onMounted(async () => {
    if (import.meta.env.VITE_APP_BASE_API == '/dev-admin') {
        const temp_data = await import(import.meta.env.VITE_APP_BASE_API == '/dev-admin' ? '../../../../temp.d.ts' : '../../../../temp_pro.d');
        token.value = '&token=' + temp_data.default.temp_token;
    } else {
        const cookie = get_type() == 'shop' ? get_cookie('user_info') : get_cookie('admin_info');
        if (cookie && cookie !== null && cookie !== 'null') {
            token.value = '&token=' + JSON.parse(cookie).token;
        }
    }
});

watch(
    () => dialog_visible.value,
    (open) => {
        if (!open) return;
        iframe_key.value = Date.now();
        let uuid_val = '';
        if (get_cookie('uuid_name')) {
            uuid_val = get_cookie('uuid_name');
        } else {
            uuid_val = get_math();
            set_cookie('uuid_name', uuid_val);
        }
        const local_base = window.location.origin;
        const public_base = import.meta.env.VITE_PUBLIC_ORIGIN || local_base;
        const external = String(common_store.common.config.preview_url || '').trim();
        const local_url =
            external !== ''
                ? external +
                  (external.includes('?') ? '&id=' : '?id=') +
                  props.dataId +
                  '&system_type=default' +
                  token.value +
                  '&uuid=' +
                  uuid_val
                : build_preview_url(local_base, uuid_val);
        const public_url =
            external !== ''
                ? local_url
                : build_preview_url(public_base, uuid_val);

        new_link.value = local_url;
        public_link.value = public_url;

        qrcode_data_url.value = '';
        QRCode.toDataURL(public_link.value, { margin: 1, width: 220 })
            .then((dataUrl) => {
                qrcode_data_url.value = dataUrl;
            })
            .catch(() => {
                qrcode_data_url.value = '';
            });
    },
    { flush: 'post' }
);
</script>
<style lang="scss" scoped>
:deep(.el-dialog__body) {
    padding: 0;
    overflow: hidden;
    background: #fff;
}

:deep(.el-dialog) {
    max-height: calc(100vh - 4rem);
    margin-top: 2rem !important;
    margin-bottom: 2rem;
}

.diy-preview-dialog__title {
    font-size: 16px;
    font-weight: 700;
}

.content-right {
    background: #fff;
}

.diy-preview-body {
    position: relative;
    height: calc(100vh - 11rem);
    max-height: 76rem;
    min-height: 52rem;
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 3.2rem;
    padding: 1.6rem 2.4rem;
}

.mobile-iframe {
    width: 40rem;
    height: min(72rem, calc(100vh - 14rem));
    max-height: 100%;
    margin: 0;
    border-radius: 2px;
}

.mobile-iframe--tips {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.4rem;
    color: #999;
    box-sizing: border-box;
}

.qrcode-card {
    background: #fff;
    border-radius: 4px;
    padding: 12px 16px;
}

.qrcode-caption {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
}

.caption-muted {
    color: #999;
}

.link-like {
    margin-left: 8px;
    color: var(--color-main, #2a94ff);
    cursor: pointer;
    text-decoration: none;
}

.link-like:hover {
    opacity: 0.85;
}

.qrcode-img-shopxo {
    display: block;
    border-radius: 4px;
    width: 100px;
    height: 100px;
    object-fit: contain;
}

.qrcode-content {
    position: static;
    flex: 0 0 auto;
}

.mobile-iframe,
.qrcode-content {
    border: 0.1rem solid #f5f5f5;
}

.qrcode-placeholder {
    width: 100px;
    height: 100px;
    line-height: 1.3;
    font-size: 12px;
    color: #999;
    background: #f7f7f7;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4px;
}

.text-copy {
    cursor: pointer;
}

@media only screen and (max-width: 640px) {
    .qrcode-content {
        display: none;
    }

    .mobile-iframe {
        margin-left: auto;
        width: min(40rem, 100% - 2rem);
    }
}
</style>
