<template>
  <div class="notice-page">
    <div class="notice-card">
      <h3>最新活动通知</h3>
      <el-empty v-if="!news.length" description="暂无活动通知" />
      <div v-for="n in news" :key="n.id" class="notice-item" @click="open(n)">
        <el-tag v-if="n.isImportant === 1" type="danger" size="small">重要</el-tag>
        <div class="notice-main">
          <div class="notice-title">{{ n.title }}</div>
          <div class="notice-meta">
            <span v-if="n.activityTime">时间：{{ n.activityTime }}</span>
            <span v-if="n.activityLocation">地点：{{ n.activityLocation }}</span>
          </div>
        </div>
        <span class="notice-date">{{ (n.createdAt || '').slice(0, 10) }}</span>
      </div>
    </div>

    <el-drawer v-model="visible" title="活动详情" size="560px">
      <div v-if="current" class="detail">
        <h2>{{ current.title }}</h2>
        <div class="meta">
          <p v-if="current.activityTime">活动时间：{{ current.activityTime }}</p>
          <p v-if="current.activityLocation">活动地点：{{ current.activityLocation }}</p>
          <p v-if="current.registerDeadline">报名截止：{{ current.registerDeadline }}</p>
        </div>
        <div class="content">{{ current.content }}</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMerchantNews } from '../../api'

const news = ref([])
const visible = ref(false)
const current = ref(null)

const open = (n) => {
  current.value = n
  visible.value = true
}

onMounted(async () => {
  const res = await getMerchantNews()
  news.value = res.data
})
</script>

<style scoped>
.notice-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
}
.notice-card h3 { font-size: 18px; color: #1f2937; margin-bottom: 16px; }
.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}
.notice-item:hover .notice-title { color: #2563eb; }
.notice-main { flex: 1; }
.notice-title { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 6px; }
.notice-meta { display: flex; gap: 16px; font-size: 13px; color: #9ca3af; }
.notice-date { font-size: 12px; color: #c0c4cc; font-family: Consolas, monospace; }
.detail h2 { font-size: 20px; color: #1f2937; margin-bottom: 14px; }
.meta { background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
.meta p { font-size: 14px; color: #4b5563; line-height: 1.9; }
.content { font-size: 15px; color: #374151; line-height: 1.9; white-space: pre-wrap; }
</style>
