<template>
  <!-- 空白页面，仅用于路由跳转 -->
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 获取要跳转的目标路径
const targetPath = route.query.path
if(targetPath) {
  router.replace(targetPath)
} else {
  // 兜底：没有目标路径跳回首页
  router.replace('/admin')
}
</script>
