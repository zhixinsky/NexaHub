<template>
    <el-config-provider :locale="zhCn">
        <!-- 勿用 keep-alive 包静态节点：在部分 Vue 版本下与弹窗/teleport 更新并发时易触发内部 subTree 空引用 -->
        <div class="message-box-custom" aria-hidden="true"><div class="el-message__icon"></div></div>
        <router-view />
    </el-config-provider>
</template>
<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
// 中文
import zhCn from 'element-plus/es/locale/lang/zh-cn';
// 英文
import en from 'element-plus/es/locale/lang/en';
</script>
<style scoped lang="scss">
.message-box-custom {
    visibility: hidden;
}
</style>
