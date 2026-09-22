<template>
  <div class="landing">
    <!-- ============ 顶部导航（吸顶） ============ -->
    <header class="nav" :class="{ scrolled: scrolled }">
      <div class="nav-inner">
        <div class="logo">
          <el-icon :size="26" color="#64748b"><Shop /></el-icon>
          <div class="logo-text">
            <span class="logo-title">天津城建</span>
            <span class="logo-sub">本地文创市集摊位管理系统</span>
          </div>
        </div>
        <nav class="menu">
          <div v-for="item in navTree" :key="item.id" class="menu-item" @mouseenter="onMouseEnter(item.id)" @mouseleave="handleMouseLeave">
            <a class="menu-link" :href="item.url || '#'">
              {{ item.name }}
              <el-icon v-if="item.children && item.children.length" class="arrow" :class="{ rotated: hovered === item.id }">
                <ArrowDown />
              </el-icon>
            </a>
            <div @mouseenter="onMouseEnter(item.id)" v-if="item.children && item.children.length && hovered === item.id" class="sub-panel">
              <a v-for="child in item.children" :key="child.id" class="sub-item" :href="child.url || '#'">
                {{ child.name }}
              </a>
            </div>
          </div>
        </nav>
        <div class="user-area">
          <template v-if="!token">
            <el-button type="primary" size="small" :disabled="!ready" @click="$router.push('/register')">注册</el-button>
            <el-button size="small" :disabled="!ready" @click="$router.push('/login')">登录</el-button>
          </template>
          <template v-else>
            <el-dropdown @command="onUserCommand">
              <span class="user-chip">
                <el-avatar :size="30" class="avatar">{{ (profile.name || '商')[0] }}</el-avatar>
                <span class="user-name">{{ profile.name }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="card">我的信息卡</el-dropdown-item>
                  <el-dropdown-item command="merchantEdit" v-if="token" >修改申请记录</el-dropdown-item>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </header>
<!-- ============ Banner（3:1 轮播） ============ -->
    <section class="banner-wrap">
      <el-carousel v-if="banners.length" height="360px" :interval="5000" arrow="hover" indicator-position="outside">
        <el-carousel-item v-for="b in banners" :key="b.id">
          <a :href="b.linkUrl || '#'" class="banner-card" :target="b.linkUrl && b.linkUrl.startsWith('http') ? '_blank' : '_self'">
            <img v-if="b.imageUrl" :src="b.imageUrl" class="banner-img" alt="" />
            <div v-else class="banner-placeholder">
              <span>{{ b.title || '暂无活动通知' }}</span>
            </div>
            <!-- 【删除这一行】<div v-if="b.title" class="banner-title">{{ b.title }}</div> -->
          </a>
        </el-carousel-item>
      </el-carousel>
      <div v-else class="banner-empty">暂无活动通知</div>
    </section>
    <!-- ============ 核心业务入口 ============ -->
    <section class="entries">
      <div class="entry-card" @click="go('stats')">
        <el-icon :size="40" color="#6366f1"><TrendCharts /></el-icon>
        <div class="entry-title">订单统计</div>
        <div class="entry-desc">收支流水一目了然</div>
      </div>
      <div class="entry-card" @click="go('new_stall')">
        <el-icon :size="40" color="#8b5cf6"><Grid /></el-icon>
        <div class="entry-title">市集竞标</div>
        <div class="entry-desc">选择心仪摊位</div>
      </div>
      <div class="entry-card" @click="go('stats')">
        <el-icon :size="40" color="#ec4899"><Odometer /></el-icon>
        <div class="entry-title">客流分析</div>
        <div class="entry-desc">掌握摊位热度</div>
      </div>
    </section>
    <!-- ============ 动态与新闻中心 ============ -->
    <section class="news-section">
      <div class="news-focus">
        <h3 class="section-title">重要通知</h3>
        <div v-for="n in importantNews" :key="n.id" class="focus-item" @click="openNews(n)">
          <div class="focus-tag">重要</div>
          <div class="focus-content">
            <div class="focus-title">{{ n.title }}</div>
            <div class="focus-summary">{{ n.summary }}</div>
          </div>
        </div>
        <div v-if="!importantNews.length" class="empty">暂无重要通知</div>
      </div>
      <div class="news-list">
        <h3 class="section-title">新闻中心</h3>
        <div class="news-scroll">
          <div v-for="n in newsList" :key="n.id" class="news-item" @click="openNews(n)">
            <span class="news-tag">{{ categoryName(n.categoryId) }}</span>
            <span class="news-title">{{ n.title }}</span>
            <span class="news-date">{{ formatDate(n.createdAt) }}</span>
          </div>
          <div v-if="!newsList.length" class="empty">暂无新闻</div>
        </div>
      </div>
    </section>
    <!-- ============ 文化合作单位生态 ============ -->
    <section class="eco-section">
      <h3 class="section-title">文化合作单位生态</h3>
      <div class="reps">
        <div v-for="r in representatives" :key="r.id" class="rep">
          <el-avatar :size="72" :src="r.avatar" class="rep-avatar">
            {{ r.name[0] }}
          </el-avatar>
          <div class="rep-name">{{ r.name }}</div>
          <div class="rep-title">{{ r.title }}</div>
        </div>
      </div>
      <div class="partners">
        <div v-for="group in partnerGroups" :key="group.category" class="partner-group">
          <div class="group-name">{{ group.category }}</div>
          <a v-for="p in group.items" :key="p.id" class="partner-name"
             :class="{ linkable: p.linkUrl }" :href="p.linkUrl || '#'"
             :target="p.linkUrl && p.linkUrl.startsWith('http') ? '_blank' : '_self'">
            {{ p.name }}
          </a>
        </div>
      </div>
    </section>
    <!-- ============ 说明页提示窗（5 秒后可注册/登录） ============ -->
    <el-dialog v-if="!profile.name" v-model="introVisible" title="欢迎来到本地文创市集摊位管理系统" width="520px" :close-on-click-modal="false"
               append-to-body class="intro-dialog">
      <div class="intro-body">
        <p>面向小型线下文创市集的一站式管理平台：</p>
        <ul>
          <li>商户在线注册、上传文创材料、竞标摊位</li>
          <li>管理员审核材料、分配摊位、发布活动</li>
          <li>客流与收支统计，经营数据一目了然</li>
        </ul>
        <el-alert v-if="!ready" type="info" :closable="false"
                  :title="`说明页停留 ${remain} 秒后可使用注册/登录`" />
      </div>
      <template #footer>
        <el-button :disabled="!ready" type="primary" @click="goLogin">登 录</el-button>
        <el-button :disabled="!ready" type="primary" plain @click="goRegister">注 册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getLanding, getNewsDetail, getProfile } from '../../api'
const router = useRouter()
const navTree = ref([])
const banners = ref([])
const importantNews = ref([])
const newsList = ref([])
const categories = ref([])
const representatives = ref([])
const partners = ref([])
const scrolled = ref(false)
const hovered = ref(null)
const token = localStorage.getItem('booth_token')
const profile = ref({ name: '' })
const introVisible = ref(true)
const ready = ref(false)
const remain = ref(5)
const newsVisible = ref(false)
const currentNews = ref(null)
let timer = null
let hover_timer=null
const onMouseEnter = (id) => {
  if (hover_timer) clearTimeout(hover_timer)
  hovered.value = id
}
const handleMouseLeave = () => {
  console.log("handleMouseLeave触发")
  if (hover_timer) clearTimeout(hover_timer)
  hover_timer = window.setTimeout(() => {
    hovered.value = null
  }, 200)
}
const partnerGroups = computed(() => {
  const groups = ['学术指导单位', '学校科普单位', '产学研单位']
  return groups.map((c) => ({
    category: c,
    items: partners.value.filter((p) => p.category === c)
  })).filter((g) => g.items.length)
})
const categoryName = (id) => {
  const c = categories.value.find((x) => x.id === id)
  return c ? c.name : '资讯'
}
const formatDate = (d) => (d || '').slice(0, 10)
const onScroll = () => { scrolled.value = window.scrollY > 10 }
const go = (name) => {
  if (!token) {
    router.push('/login')
    return
  }
  router.push(`/merchant/${name}`)
}
const goLogin = () => router.push('/login')
const goRegister = () => router.push('/register')
const onUserCommand = (cmd) => {
  if(cmd === 'merchantEdit') router.push({
    name: 'merchantEdit'
  })
  if (cmd === 'card') router.push('/merchant/card')
  if (cmd === 'logout') {
    localStorage.removeItem('booth_token')
    localStorage.removeItem('booth_role')
    location.reload()
  }
}
const openNews = (n) => {
  router.push({
    name:'newsDetail',
    params:{ id: n.id }
  })
}
onMounted(async () => {
  window.addEventListener('scroll', onScroll)
  timer = setInterval(() => {
    remain.value--
    if (remain.value <= 0) {
      ready.value = true
      clearInterval(timer)
    }
  }, 1000)
  try {
    const res = await getLanding()
    navTree.value = res.data.navTree || []
    banners.value = res.data.banners || []
    importantNews.value = res.data.importantNews || []
    newsList.value = res.data.newsList || []
    categories.value = res.data.categories || []
    representatives.value = res.data.representatives || []
    partners.value = res.data.partners || []
  } catch (e) { /* 已由拦截器提示 */ }
  if (token) {
    try {
      const res = await getProfile()
      console.log(res)
      profile.value = res.data
    } catch (e) { /* ignore */ }
  }
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* ========== 全局：柔和色染画底 ========== */
.landing {
  min-height: 100vh;
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
}

.landing::before {
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

/* ========== 导航：半透明柔光条 ========== */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  transition: all 0.4s ease;
}

.nav.scrolled {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.12);
}

.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.logo { display: flex; align-items: center; gap: 10px; }

.logo-text { display: flex; flex-direction: column; }

.logo-title {
  font-size: 18px;
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.3px;
}

.logo-sub { font-size: 11px; color: #94a3b8; }

.menu { display: flex; gap: 6px; }

.menu-item { position: relative; }

.menu-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  color: #475569;
  text-decoration: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3));
  border: 1px solid rgba(255,255,255,0.5);
  transition: all 0.3s ease;
}

.menu-link:hover {
  color: #4f46e5;
  background: linear-gradient(135deg, rgba(165,180,252,0.35), rgba(244,114,182,0.25));
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.18);
  transform: translateY(-1px);
}

.arrow { transition: transform 0.3s ease; }

.arrow.rotated { transform: rotate(180deg); }

.sub-panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 160px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 16px 40px rgba(99, 102, 241, 0.18);
  border-radius: 14px;
  padding: 10px 0;
  animation: softDrop 0.28s ease;
}

@keyframes softDrop {
  from { opacity: 0; transform: translateY(-6px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.sub-item {
  display: block;
  padding: 10px 18px;
  font-size: 13px;
  color: #475569;
  text-decoration: none;
  border-radius: 10px;
  margin: 0 8px;
  transition: all 0.25s ease;
}

.sub-item:hover {
  color: #4f46e5;
  background: linear-gradient(135deg, rgba(165,180,252,0.3), rgba(244,114,182,0.2));
}

.user-area { display: flex; align-items: center; gap: 8px; }

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
  max-width: 6em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #334155;
}

/* ========== Banner：柔焦画框感 ========== */
.banner-wrap {
  max-width: 1200px;
  margin: 28px auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.banner-card {
  position: relative;
  display: block;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(99, 102, 241, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.banner-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(236,72,153,0.12));
  pointer-events: none;
}

.banner-img { width: 100%; height: 100%; object-fit: cover; }

.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 40%, rgba(165,180,252,0.6), transparent 35%),
    radial-gradient(circle at 70% 60%, rgba(244,114,182,0.5), transparent 35%),
    linear-gradient(135deg, #eef2ff, #fce7f3);
  color: #4f46e5;
  font-size: 22px;
  font-weight: 600;
}

.banner-title {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  padding: 16px 20px;
  background: rgba(255,255,255,0.35);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  color: #1e293b;
  font-size: 20px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.6);
  z-index: 2;
}

.banner-empty {
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: linear-gradient(135deg, #eef2ff, #fce7f3);
  color: #94a3b8;
}

/* ========== 核心入口：漂浮色卡 ========== */
.entries {
  max-width: 1200px;
  margin: 40px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;
}

.entry-card {
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  animation: cardIn 0.8s ease both;
}

.entry-card:nth-child(1) { animation-delay: 0.1s; }
.entry-card:nth-child(2) { animation-delay: 0.2s; }
.entry-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.entry-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(129,140,248,0.6), rgba(236,72,153,0.4), rgba(52,211,153,0.4));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  opacity: 0.7;
  transition: opacity 0.4s ease;
}

.entry-card::after {
  content: "";
  position: absolute;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(165,180,252,0.35), transparent 40%);
  top: -80px;
  right: -80px;
  transition: transform 0.6s ease;
}

.entry-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 60px rgba(99, 102, 241, 0.22);
}

.entry-card:hover::after {
  transform: translate(-20px, 20px) scale(1.1);
}

.entry-card:hover .entry-title { color: #4f46e5; }

.entry-title {
  font-size: 17px;
  font-weight: 600;
  color: #334155;
  transition: color 0.3s ease;
}

.entry-desc { font-size: 13px; color: #94a3b8; }

/* ========== 新闻区：柔光玻璃卡 ========== */
.news-section {
  max-width: 1200px;
  margin: 48px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 16px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 4px;
  border-radius: 4px;
  background: linear-gradient(180deg, #818cf8, #ec4899);
}

.news-focus, .news-list {
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 16px 40px rgba(99, 102, 241, 0.12);
}

.focus-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.4);
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.focus-item:last-child { margin-bottom: 0; }

.focus-item:hover {
  transform: translateX(4px);
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.18);
}

.focus-tag {
  flex-shrink: 0;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f43f5e, #fb7185);
  color: #fff;
  font-size: 12px;
  line-height: 24px;
}

.focus-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.focus-summary {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
}

.news-scroll {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: none;
}

.news-scroll::-webkit-scrollbar { display: none; }

.news-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  background: rgba(255,255,255,0.35);
  border: 1px solid rgba(255,255,255,0.5);
  transition: transform 0.3s ease, background 0.3s ease;
}

.news-item:hover {
  background: linear-gradient(135deg, rgba(165,180,252,0.3), rgba(244,114,182,0.2));
  transform: translateX(4px);
}

.news-item:hover .news-title { color: #4f46e5; }

.news-tag {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #c7d2fe, #fbcfe8);
  color: #4f46e5;
  font-size: 12px;
}

.news-title {
  flex: 1;
  font-size: 14px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.news-date {
  flex-shrink: 0;
  font-size: 12px;
  color: #94a3b8;
  font-family: Consolas, monospace;
}

.empty { color: #94a3b8; font-size: 13px; text-align: center; padding: 24px 0; }

/* ========== 合作生态：漂浮展陈卡 ========== */
.eco-section {
  max-width: 1200px;
  margin: 48px auto 60px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(99, 102, 241, 0.12);
  position: relative;
  z-index: 1;
}

.reps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.rep {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 10px;
  border-radius: 20px;
  background: rgba(255,255,255,0.45);
  border: 1px solid rgba(255,255,255,0.6);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.rep:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(99, 102, 241, 0.2);
}

.rep-avatar {
  background: linear-gradient(135deg, #a5b4fc, #f9a8d4);
  color: #fff;
  font-weight: 600;
}

.rep-name { font-size: 14px; font-weight: 600; color: #334155; }

.rep-title { font-size: 12px; color: #94a3b8; }

.partners { display: flex; flex-direction: column; gap: 14px; }

.partner-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.5);
  transition: background 0.3s ease;
}

.partner-group:hover { background: rgba(255,255,255,0.6); }

.group-name { font-size: 14px; font-weight: 600; color: #475569; width: 120px; }

.partner-name {
  font-size: 14px;
  color: #64748b;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.5);
  transition: all 0.3s ease;
}

.partner-name.linkable:hover {
  color: #4f46e5;
  background: linear-gradient(135deg, rgba(165,180,252,0.35), rgba(244,114,182,0.25));
  transform: translateY(-2px);
}

/* ========== 弹窗：柔和彩糖感 ========== */
.intro-dialog :deep(.el-dialog) {
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 0%, rgba(165,180,252,0.35), transparent 30%),
    radial-gradient(circle at 90% 100%, rgba(244,114,182,0.25), transparent 30%),
    #fff;
}

.intro-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(165,180,252,0.3), rgba(244,114,182,0.2));
  color: #334155;
}

.intro-body { color: #475569; }

.intro-body ul { margin: 12px 0 12px 20px; }

.intro-body li {
  font-size: 14px;
  line-height: 2;
  padding-left: 8px;
  position: relative;
}

.intro-body li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #818cf8, #ec4899);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .entries { grid-template-columns: 1fr; }
  .news-section { grid-template-columns: 1fr; }
  .menu { display: none; }
}
</style>
