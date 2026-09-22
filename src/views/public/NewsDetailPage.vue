<template>
  <div class="news-detail-page">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="!news" class="not-found">
      <h2>该新闻不存在或已被下线</h2>
      <el-button @click="$router.push('/')">返回首页</el-button>
    </div>
    <div v-else class="container">
      <div class="header">
        <h1>{{ news.title }}</h1>
        <div class="meta">
          <span v-if="news.categoryName">分类：{{ news.categoryName }}</span>
          <span v-if="news.activityTime">活动时间：{{ news.activityTime }}</span>
          <span v-if="news.activityLocation">活动地点：{{ news.activityLocation }}</span>
        </div>
        <el-tag v-if="news.isImportant ===1" type="danger">重要通知</el-tag>
      </div>
      <div v-if="news.coverUrl" class="cover">
        <el-image :src="news.coverUrl" fit="cover"/>
      </div>
      <div class="summary" v-if="news.summary">
        {{ news.summary }}
      </div>
      <div class="content">
        {{ news.content }}
      </div>
      <div class="back">
        <el-button @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getNewsDetail } from '../../api/index.js'
const route = useRoute()
const router = useRouter()
const news = ref(null)
const loading = ref(true)
const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getNewsDetail(route.params.id)
    news.value = res.data
  } catch(err) {
    news.value = null
  } finally {
    loading.value = false
  }
}
onMounted(()=>{
  fetchDetail()
})
// 监听路由id变化，从别的新闻跳转时刷新内容
watch(()=>route.params.id, ()=>{
  fetchDetail()
})
</script>
<style scoped>
.news-detail-page{
  min-height: 100vh;
  padding:40px 20px;
  position:relative;
  /* 和首页、商户页完全一致背景 */
  background:
    radial-gradient(circle at 12% 18%, rgba(165, 180, 252, 0.28), transparent 26%),
    radial-gradient(circle at 85% 12%, rgba(244, 114, 182, 0.18), transparent 28%),
    radial-gradient(circle at 75% 85%, rgba(52, 211, 153, 0.18), transparent 30%),
    radial-gradient(circle at 25% 78%, rgba(250, 204, 21, 0.12), transparent 24%),
    linear-gradient(180deg, #fbfbff 0%, #f5f7ff 45%, #fef7ff 100%);
  background-attachment: fixed;
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
}

.news-detail-page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 30%, rgba(129, 140, 248, 0.08), transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.07), transparent 32%);
  z-index: 0;
  animation: softFloat 18s ease-in-out infinite alternate;
}
@keyframes softFloat {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  100% { transform: translate3d(-10px, 8px, 0) scale(1.04); }
}

.container{
  max-width:800px;
  margin:0 auto;
  padding:36px;
  border-radius:24px;
  position:relative;
  z-index:1;
  /* 玻璃卡片样式 */
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 16px 40px rgba(99, 102, 241, 0.12);
}
.header h1{
  font-size:26px;
  color:#334155;
  margin-bottom:12px;
}
.meta{
  display:flex;
  flex-wrap: wrap;
  gap:18px;
  font-size:14px;
  color:#64748b;
  margin-bottom:12px;
}
.cover{
  margin:20px 0;
}
.cover :deep(.el-image){
  width:100%;
  height:auto;
  border-radius:16px;
  overflow:hidden;
}
.summary{
  padding:16px;
  background: linear-gradient(135deg, rgba(165,180,252,0.15), rgba(244,114,182,0.1));
  border-radius:16px;
  color:#475569;
  margin-bottom:20px;
  border:1px solid rgba(255,255,255,0.6);
}
.content{
  font-size:16px;
  line-height:2;
  color:#334155;
  white-space:pre-wrap;
}
.back{
  margin-top:30px;
}
.back :deep(.el-button){
  border-radius:999px;
  padding: 8px 20px;
}
.not-found{
  text-align:center;
  padding:80px 0;
  position:relative;
  z-index:1;
}
.loading{
  text-align:center;
  padding:60px;
  position:relative;
  z-index:1;
}
</style>
