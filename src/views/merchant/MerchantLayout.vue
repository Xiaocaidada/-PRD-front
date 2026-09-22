<template>
  <div class="merchant-layout">
    <header class="top-nav" :class="{ scrolled: scrolled }">
      <div class="nav-inner">
        <div class="logo" @click="$router.push('/')">
          <el-icon :size="24" color="#2563eb"><Shop /></el-icon>
          <span class="logo-name">天津城建 · 文创市集</span>
        </div>
        <nav class="tabs">
          <router-link to="/merchant/card" class="tab" active-class="active">摊位信息卡</router-link>
          <router-link to="/merchant/materials" class="tab" active-class="active">材料上传</router-link>
          <router-link to="/merchant/new_stall" class="tab" active-class="active">市集竞标</router-link>
          <router-link to="/merchant/news" class="tab" active-class="active">活动通知</router-link>
          <router-link to="/merchant/stats" class="tab" active-class="active">客流与收支</router-link>
        </nav>
        <el-dropdown @command="onCommand">
          <span class="user-chip">
            <el-avatar :size="30" class="avatar">{{ (profile.name || '商')[0] }}</el-avatar>
            <span class="user-name">{{ profile.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown >
            <el-dropdown-menu>
              <el-dropdown-item command="merchantEdit" v-if="token" >修改申请记录</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    <main class="content">
      <router-view/>
    </main>
    <footer class="foot">
     天津科技大学软件工程项目 · 本地文创市集摊位管理系统 · 限本人使用
    </footer>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile } from '../../api'
const router = useRouter()
const profile = ref({ name: localStorage.getItem('booth_name') || '' })
const token = ref(localStorage.getItem('booth_token'))
const scrolled = ref(false)
const onCommand = (cmd) => {
  if (cmd === 'merchantEdit') {
    router.push('/merchant/edit')
  }
  if (cmd === 'logout') {
    localStorage.removeItem('booth_token')
    localStorage.removeItem('booth_role')
    localStorage.removeItem('booth_name')
    router.push('/')
  }
}
const onScroll = () => {
  scrolled.value = window.scrollY > 10
}
onMounted(async () => {
  window.addEventListener('scroll', onScroll)
  try {
    const res = await getProfile()
    profile.value = res.data
  } catch (e) { /* 已由拦截器提示 */ }
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
<style scoped>
.merchant-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 12% 18%, rgba(165, 180, 252, 0.28), transparent 26%),
    radial-gradient(circle at 85% 12%, rgba(244, 114, 182, 0.18), transparent 28%),
    radial-gradient(circle at 75% 85%, rgba(52, 211, 153, 0.18), transparent 30%),
    radial-gradient(circle at 25% 78%, rgba(250, 204, 21, 0.12), transparent 24%),
    linear-gradient(180deg, #fbfbff 0%, #f5f7ff 45%, #fef7ff 100%);
  background-attachment: fixed;
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  color: #475569;
  overflow-x: hidden;
  overflow-y: hidden;
  position: relative;
}
.merchant-layout::before {
  content: "";
  position: absolute;
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
.top-nav {
  position: sticky;
  top: 0;
  /* 修改z-index从100 -> 10 */
  z-index: 10;
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.4s ease;
}
.top-nav.scrolled {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.12);
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.logo-name {
  font-size: 16px;
  font-weight: 700;
  color: #334155;
}
.tabs {
  display: flex;
  gap: 6px;
}
.tab {
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  color: #475569;
  text-decoration: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3));
  border: 1px solid rgba(255,255,255,0.5);
  transition: all 0.3s ease;
}
.tab:hover {
  color: #4f46e5;
  background: linear-gradient(135deg, rgba(165,180,252,0.35), rgba(244,114,182,0.25));
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.18);
  transform: translateY(-1px);
}
.tab.active {
  color: #4f46e5;
  background: linear-gradient(135deg, rgba(165,180,252,0.35), rgba(244,114,182,0.25));
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.15);
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none !important;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(255,255,255,0.6);
  transition: all 0.3s ease;
}
.user-chip:hover {
  background: linear-gradient(135deg, rgba(165,180,252,0.3), rgba(244,114,182,0.2));
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.15);
}
.avatar {
  background: linear-gradient(135deg, #818cf8, #ec4899);
  color: #fff;
}
.user-name {
  font-size: 14px;
  color: #334155;
}
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 24px auto;
  padding: 0 24px;
  position: relative;
  z-index:1;
  overflow-y: auto;
}
.foot {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 13px;
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  position: relative;
  z-index:1;
}
</style>
