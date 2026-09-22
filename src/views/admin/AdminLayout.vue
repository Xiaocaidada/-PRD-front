<template>
  <div class="admin-layout" :class="[isCollapsed ? 'collapsed' : '', darkMode ? 'dark-layout' : '']">
    <!--全局水印-->
    <div class="watermark" v-if="showWatermark"></div>

    <!--移动端遮罩-->
    <transition name="sidebar-mask">
      <div v-if="isMobile && sidebarOpen" class="sidebar-mask" @click="sidebarOpen = false"></div>
    </transition>

    <!--侧边栏-->
    <aside
      class="sidebar"
      :class="[
        { mobileDrawer: isMobile, drawerOpen: sidebarOpen },
        { 'dark-sidebar': darkMode }
      ]"
    >
      <div class="brand">
        <div class="brand-icon-wrap">
          <el-icon :size="24" color="#ffffff"><Management /></el-icon>
        </div>
        <span v-show="!isCollapsed" class="brand-text">管理后台</span>
      </div>

      <nav class="menu">
        <el-tooltip
          v-for="item in menuItems"
          :key="item.index"
          :content="item.title"
          placement="right"
          :disabled="!isCollapsed"
          effect="light"
          :open-delay="300"
        >
          <div
            class="menu-item"
            :class="{ active: route.path === item.index }"
            @click="goMenu(item.index); isMobile && (sidebarOpen = false)"
          >
            <div class="menu-item-inner">
              <el-icon :size="18">
                <component :is="item.icon" />
              </el-icon>
              <span v-show="!isCollapsed" class="menu-text">{{ item.title }}</span>
            </div>
            <div class="active-indicator"></div>
          </div>
        </el-tooltip>
      </nav>

      <!--侧边栏底部：主题切换开关-->
      <div class="sidebar-footer" v-show="!isCollapsed">
        <div class="theme-switch">
          <span class="label">全局暗色主题</span>
          <el-switch v-model="darkMode" size="small" />
        </div>
      </div>
    </aside>

    <!--主内容区域-->
    <div class="main">
      <header class="topbar" :class="{ topbarShadow: topbarShadowFlag }">
        <div class="topbar-left">
          <el-button text @click="toggleCollapse" class="collapse-btn">
            <el-icon :size="20">
              <Expand v-if="isCollapsed" />
              <Fold v-else />
            </el-icon>
          </el-button>

          <div class="breadcrumb-wrap">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>管理后台</el-breadcrumb-item>
              <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="topbar-right">
          <el-tooltip content="刷新页面" placement="bottom">
            <el-button text @click="refreshPage" class="top-icon-btn">
              <el-icon :size="18"><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="全屏切换" placement="bottom">
            <el-button text @click="toggleFullScreen" class="top-icon-btn">
              <el-icon :size="18"><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>

          <el-dropdown @command="onCommand" trigger="click">
            <span class="admin-chip">
              <el-avatar :size="32" class="avatar">{{ (adminName || '管')[0] }}</el-avatar>
              <span v-show="!isMobile" class="admin-name">{{ adminName }}</span>
              <el-icon class="drop-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!--标签页栏-->
      <div class="tags-view-container" @contextmenu.prevent>
        <el-scrollbar class="tags-scroll">
          <el-tabs
            v-model="activeTabPath"
            type="card"
            @tab-change="handleTabClick"
            @tab-remove="handleRemoveTab"
            @contextmenu-tab="handleTabContextMenu"
          >
            <el-tab-pane
              v-for="tab in tabList"
              :key="tab.path"
              :label="tab.title"
              :name="tab.path"
              :closable="!tab.affix"
            />
          </el-tabs>
        </el-scrollbar>
      </div>

      <!--标签右键菜单-->
      <el-dropdown
        ref="tabContextMenuRef"
        v-model:visible="tabMenuVisible"
        :style="{ left: tabMenuX + 'px', top: tabMenuY + 'px' }"
        trigger="manual"
      >
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="refresh">刷新当前</el-dropdown-item>
            <el-dropdown-item command="closeOthers">关闭其他</el-dropdown-item>
            <el-dropdown-item command="closeAll">关闭全部</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <main class="content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedComponentNames">
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import {
  Management, User, Grid, Shop, Bell, Folder, Menu, Picture,
  Star, OfficeBuilding, TrendCharts, Expand, Fold, ArrowDown,
  Refresh, FullScreen
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const tabContextMenuRef = ref(null)

// ============ 主题核心状态 ============
const darkMode = ref(localStorage.getItem('admin_dark_mode') === 'true')
watch(darkMode, (val) => {
  localStorage.setItem('admin_dark_mode', val)
  // 同步 Element‑Plus 官方 dark 模式
  document.documentElement.classList.toggle('dark', val)
})

// 侧边栏折叠
const isCollapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
watch(isCollapsed, (val) => localStorage.setItem('sidebar_collapsed', String(val)))
const toggleCollapse = () => { isCollapsed.value = !isCollapsed.value }

// 移动端
const isMobile = ref(false)
const sidebarOpen = ref(false)
const topbarShadowFlag = ref(false)
const showWatermark = ref(true)
const adminName = localStorage.getItem('admin_booth_name') || '管理员'

// 菜单配置（和你市集项目完全对应）
const menuItems = [
  { index: '/admin/users', title: '用户管理', icon: User },
  { index: '/admin/layout-templates', title: '市集布局模板', icon: Grid },
  { index: '/admin/markets', title: '市集管理', icon: Shop },
  { index: '/admin/stalls', title: '摊位分配', icon: Grid },
  { index: '/admin/news', title: '新闻中心', icon: Bell },
  { index: '/admin/categories', title: '文章分类', icon: Folder },
  { index: '/admin/navs', title: '导航管理', icon: Menu },
  { index: '/admin/banners', title: 'Banner 管理', icon: Picture },
  { index: '/admin/reps', title: '代表人物', icon: Star },
  { index: '/admin/partners', title: '合作单位', icon: OfficeBuilding },
  { index: '/admin/stats', title: '统计管理', icon: TrendCharts }
]

const titles = {
  '/admin/users': '用户管理',
  '/admin/stalls': '摊位分配',
  '/admin/news': '新闻中心',
  '/admin/categories': '文章分类管理',
  '/admin/navs': '导航管理',
  '/admin/banners': 'Banner 管理',
  '/admin/reps': '创意创新代表人物',
  '/admin/partners': '合作单位管理',
  '/admin/stats': '统计管理',
  '/admin/layout-templates': '市集布局模板',
  '/admin/layout-editor': '布局模板编辑器',
  '/admin/markets': '市集管理'
}
const pageTitle = computed(() => titles[route.path] || '管理后台')
const goMenu = (path) => router.push(path)

// 退出登录
const onCommand = (cmd) => {
  if (cmd === 'logout') {
    localStorage.removeItem('admin_booth_token')
    localStorage.removeItem('admin_booth_role')
    localStorage.removeItem('admin_booth_name')
    sessionStorage.removeItem('tagsViewList')
    router.push('/admin/login')
  }
}

// ============ 标签页系统 ============
const affixTab = { path: '/admin/users', title: '用户管理', affix: true }
const activeTabPath = ref('')
const tabList = ref([])
const cachedComponentNames = ref([])
const tabMenuVisible = ref(false)
const tabMenuX = ref(0)
const tabMenuY = ref(0)
const currentRightClickTabPath = ref('')

function initTabs() {
  const stored = sessionStorage.getItem('tagsViewList')
  tabList.value = stored ? JSON.parse(stored) : [affixTab]
}
function saveTabsStorage() {
  sessionStorage.setItem('tagsViewList', JSON.stringify(tabList.value))
}

watch(() => route.path, (newPath) => {
  NProgress.start()
  activeTabPath.value = newPath
  if (!tabList.value.some(t => t.path === newPath)) {
    tabList.value.push({ path: newPath, title: titles[newPath] || newPath, affix: false })
    saveTabsStorage()
  }
  nextTick(() => NProgress.done())
}, { immediate: true })

function handleTabClick(tabPath) {
  if (route.path !== tabPath) router.push(tabPath)
}
function handleRemoveTab(removePath) {
  const index = tabList.value.findIndex(t => t.path === removePath)
  if (index > -1) {
    tabList.value.splice(index, 1)
    saveTabsStorage()
    if (route.path === removePath) router.push(tabList.value.at(-1).path)
  }
}

// 标签右键菜单
function handleTabContextMenu(tabPath, e) {
  e.preventDefault()
  tabMenuX.value = e.clientX
  tabMenuY.value = e.clientY
  currentRightClickTabPath.value = tabPath
  tabMenuVisible.value = true
}
watch(tabContextMenuRef, () => {
  if (!tabContextMenuRef.value) return
  tabContextMenuRef.value.handleCommand = (cmd) => {
    const path = currentRightClickTabPath.value
if (cmd === 'refresh') {
  router.replace({
    path: '/redirect',
    query: {
      path: path
    }
  })
}
    if (cmd === 'closeOthers') {
      tabList.value = tabList.value.filter(t => t.affix || t.path === path)
      saveTabsStorage()
      router.push(path)
    }
    if (cmd === 'closeAll') {
      tabList.value = [affixTab]
      saveTabsStorage()
      router.push(affixTab.path)
    }
    tabMenuVisible.value = false
  }
})

const refreshPage = () => {
  router.replace({
    path: '/redirect',
    query: {
      path: route.path
    }
  })
}
const toggleFullScreen = () => {
  !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen()
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (window.innerWidth < 1200 && !isMobile.value) isCollapsed.value = true
}

onMounted(() => {
  initTabs()
  handleResize()
  window.addEventListener('resize', handleResize)
  // 页面加载同步主题状态
  document.documentElement.classList.toggle('dark', darkMode.value)
})
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
/* 全局平滑过渡 */
.admin-layout,
.sidebar,
.main,
.topbar,
.tags-view-container,
.content {
  transition: background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fb;
  color: #1f2937;
  position: relative;
}

/*水印浅色*/
.watermark {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180'%3E%3Ctext x='0' y='80' font-size='14' fill='%23999' fill-opacity='0.12' transform='rotate(-25 120 90)'%3E后台系统%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
}

/*侧边栏浅色*/
.sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #eef1f6;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

/*侧边栏深色模式*/
.sidebar.dark-sidebar {
  background: #111827;
  border-right-color: #1f2937;
}
.sidebar.dark-sidebar .brand { border-bottom-color: #1f2937; }
.sidebar.dark-sidebar .brand-text {
  background: linear-gradient(135deg, #a5b4fc, #c4b5fd);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.sidebar.dark-sidebar .menu-item-inner { color: #9ca3af; }
.sidebar.dark-sidebar .menu-item:hover { background: #1f2937; }
.sidebar.dark-sidebar .menu-item:hover .menu-item-inner { color: #fff; }
.sidebar.dark-sidebar .menu-item.active { background: linear-gradient(90deg, #312e81, #4c1d95); }
.sidebar.dark-sidebar .menu-item.active .menu-item-inner { color: #fff; }
.sidebar.dark-sidebar .active-indicator { background: linear-gradient(180deg, #a5b4fc, #c4b5fd); }
.sidebar.dark-sidebar .sidebar-footer { border-top-color: #1f2937; }
.sidebar.dark-sidebar .theme-switch { color: #9ca3af; }
.sidebar.dark-sidebar::-webkit-scrollbar-thumb { background: #374151; }

/*品牌头部*/
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px 18px;
  border-bottom: 1px dashed #eef1f6;
  flex-shrink: 0;
}
.brand-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
  flex-shrink: 0;
}
.brand-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/*菜单*/
.menu {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.menu-item {
  position: relative;
  height: 44px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
}
.menu-item-inner {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0 14px;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.25s ease;
}
.menu-item:hover {
  background: #f0f4ff;
  transform: translateX(2px) translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
}
.menu-item:hover .menu-item-inner { color: #4f46e5; }
.menu-item.active { background: linear-gradient(90deg, #eef2ff, #f5f3ff); }
.menu-item.active .menu-item-inner { color: #4f46e5; }

.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 0 4px 4px 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.menu-item.active .active-indicator { transform: translateY(-50%) scaleY(1); }

.sidebar-footer {
  padding: 14px 16px;
  border-top: 1px solid #eef1f6;
  flex-shrink: 0;
}
.theme-switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size:13px;
  color:#6b7280;
}

/*折叠状态*/
.admin-layout.collapsed .sidebar { width: 68px; }
.admin-layout.collapsed .menu-item-inner { justify-content: center; padding: 0; }
.admin-layout.collapsed .brand { justify-content: center; padding: 22px 10px 18px; }
.admin-layout.collapsed .sidebar-footer { display: none; }

/*移动端抽屉*/
.sidebar-mask { position: fixed; inset:0; background:rgba(0,0,0,0.45); z-index:99; }
.sidebar-mask-enter-from, .sidebar-mask-leave-to { opacity:0; }
.sidebar-mask-enter-active, .sidebar-mask-leave-active { transition: opacity 0.24s ease; }
.sidebar.mobileDrawer { position: fixed; left:-220px; top:0; transition:left 0.3s ease; }
.sidebar.drawerOpen { left:0; }

/*主区域浅色*/
.main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.topbar {
  height: 64px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid #eef1f6;
  position: sticky;
  top: 0;
  z-index: 10;
}
.topbar.topbarShadow { box-shadow: 0 2px 14px rgba(0, 0, 0, 0.07); }
.topbar-left { display: flex; align-items: center; gap: 14px; }
.breadcrumb-wrap { font-size: 14px; color:#666; }
.topbar-right { display: flex; align-items: center; gap: 6px; }
.top-icon-btn { width:36px; height:36px; }

.collapse-btn {
  width: 38px; height: 38px; border-radius: 10px;
  color: #4b5563; background: #f3f4f6;
  transition: all 0.25s ease;
}
.collapse-btn:hover {
  background: #eef2ff; color: #4f46e5; transform: rotate(-6deg);
}

.admin-chip {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; font-size: 14px; color: #374151;
  padding: 6px 12px 6px 8px; border-radius: 999px;
  background: #f3f4f6; transition: background 0.25s ease, transform 0.2s ease;
}
.admin-chip:hover { background: #eef2ff; transform: translateY(-1px); }
.avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-weight: 600;
}
.admin-name { color: #374151; }
.drop-icon { font-size: 12px; color: #6b7280; }

/*标签栏浅色*/
.tags-view-container {
  height: 40px; background: #ffffff; border-bottom: 1px solid #eef1f6;
}
.tags-scroll { height: 100%; }
.tags-view-container :deep(.el-tabs) { --el-tabs-header-height: 40px; }
.tags-view-container :deep(.el-tabs__item) {
  height: 32px; line-height: 32px; font-size: 13px;
}

/*内容区浅色*/
.content { padding: 24px 28px; flex: 1; overflow: auto; background:#f5f7fb; }

/*==== 全局dark-layout，整体切换 ====*/
.admin-layout.dark-layout { background: #0b1020; }
.admin-layout.dark-layout .watermark {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180'%3E%3Ctext x='0' y='80' font-size='14' fill='%23fff' fill-opacity='0.06' transform='rotate(-25 120 90)'%3E后台系统%3C/text%3E%3C/svg%3E");
}

/*顶部栏深色*/
.sidebar.dark-sidebar ~ .main .topbar {
  background: rgba(17, 24, 39, 0.88);
  border-bottom-color: #1f2937;
}
.sidebar.dark-sidebar ~ .main .breadcrumb-wrap { color: #d1d5db; }
.sidebar.dark-sidebar ~ .main .collapse-btn,
.sidebar.dark-sidebar ~ .main .top-icon-btn {
  background: #1f2937; color: #c9cdd4;
}
.sidebar.dark-sidebar ~ .main .collapse-btn:hover,
.sidebar.dark-sidebar ~ .main .top-icon-btn:hover {
  background: #312e81; color: #fff;
}
.sidebar.dark-sidebar ~ .main .admin-chip { background: #1f2937; color: #e5e7eb; }
.sidebar.dark-sidebar ~ .main .admin-chip:hover { background: #312e81; }

/*标签栏深色*/
.sidebar.dark-sidebar ~ .main .tags-view-container { background: #111827; border-bottom-color: #1f2937; }
.sidebar.dark-sidebar ~ .main :deep(.el-tabs__header) { background: #111827; border-color: #1f2937; }
.sidebar.dark-sidebar ~ .main :deep(.el-tabs__item) { color: #9ca3af; }
.sidebar.dark-sidebar ~ .main :deep(.el-tabs__item:hover) { color: #fff; background:#1f2937; }
.sidebar.dark-sidebar ~ .main :deep(.el-tabs__item.is-active) {
  color: #fff;
  background: linear-gradient(90deg, #312e81, #4c1d95);
}

/*内容容器深色背景*/
.sidebar.dark-sidebar ~ .main .content { background: #0b1020; color: #e5e7eb; }

/*Element组件深度样式兜底（配合element‑plus dark css‑vars.css）*/
.sidebar.dark-sidebar ~ .main :deep(.el-card) { background:#111827; border-color:#1f2937; color:#e5e7eb; }
.sidebar.dark-sidebar ~ .main :deep(.el-table) { background:#111827; color:#e5e7eb; }
.sidebar.dark-sidebar ~ .main :deep(.el-table th.el-table__cell) { background:#1f2937; color:#fff; border-color:#272e3b; }
.sidebar.dark-sidebar ~ .main :deep(.el-table td.el-table__cell) { background:#111827; border-color:#272e3b; color:#d1d5db; }
.sidebar.dark-sidebar ~ .main :deep(.el-table__body tr:hover>td) { background:#1f2937 !important; }

.sidebar.dark-sidebar ~ .main :deep(.el-input__wrapper) { background:#1f2937; box-shadow:0 0 0 1px #374151 inset; }
.sidebar.dark-sidebar ~ .main :deep(.el-input__inner) { color:#e5e7eb; }
.sidebar.dark-sidebar ~ .main :deep(.el-select__wrapper) { background:#1f2937; box-shadow:0 0 0 1px #374151 inset; }
.sidebar.dark-sidebar ~ .main :deep(.el-textarea__inner) { background:#1f2937; color:#e5e7eb; border-color:#374151; }
.sidebar.dark-sidebar ~ .main :deep(.el-form-item__label) { color:#d1d5db; }

/*页面切换动画*/
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-enter-active { transition: all 0.3s ease; }
.fade-enter-to { opacity: 1; transform: translateY(0); }
.fade-leave-from { opacity: 1; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-leave-to { opacity: 0; }

@media (max-width:768px) {
  .sidebar { display: none; }
  .sidebar.mobileDrawer { display:flex; }
  .content { padding:16px; }
  .topbar { padding:0 12px; }
}






/* ========== 修复业务页面残留白底 ========== */

.admin-layout.dark-layout .content {
  background: #0b1020 !important;
}

/* 业务页卡片 / 面板 */
.admin-layout.dark-layout :deep(.el-card),
.admin-layout.dark-layout :deep(.card),
.admin-layout.dark-layout :deep(.panel),
.admin-layout.dark-layout :deep(.box),
.admin-layout.dark-layout :deep(.container),
.admin-layout.dark-layout :deep([class*="card"]),
.admin-layout.dark-layout :deep([class*="Card"]),
.admin-layout.dark-layout :deep([class*="panel"]),
.admin-layout.dark-layout :deep([class*="Panel"]),
.admin-layout.dark-layout :deep([class*="content-box"]),
.admin-layout.dark-layout :deep([class*="contentBox"]),
.admin-layout.dark-layout :deep([class*="content-box"]),
.admin-layout.dark-layout :deep([class*="bg-white"]),
.admin-layout.dark-layout :deep([class*="bgWhite"]),
.admin-layout.dark-layout :deep([class*="white-bg"]),
.admin-layout.dark-layout :deep([class*="whiteBg"]) {
  background-color: #111827 !important;
  color: #e5e7eb !important;
  border-color: #1f2937 !important;
}

/* 业务页标题文字 */
.admin-layout.dark-layout :deep(h1),
.admin-layout.dark-layout :deep(h2),
.admin-layout.dark-layout :deep(h3),
.admin-layout.dark-layout :deep(h4),
.admin-layout.dark-layout :deep(h5),
.admin-layout.dark-layout :deep(h6),
.admin-layout.dark-layout :deep(.title),
.admin-layout.dark-layout :deep(.page-title),
.admin-layout.dark-layout :deep(.section-title),
.admin-layout.dark-layout :deep([class*="title"]),
.admin-layout.dark-layout :deep([class*="Title"]) {
  color: #f9fafb !important;
}

/* 业务页普通文字 */
.admin-layout.dark-layout :deep(p),
.admin-layout.dark-layout :deep(span),
.admin-layout.dark-layout :deep(div),
.admin-layout.dark-layout :deep(label),
.admin-layout.dark-layout :deep(.text),
.admin-layout.dark-layout :deep(.desc),
.admin-layout.dark-layout :deep(.info),
.admin-layout.dark-layout :deep(.tip),
.admin-layout.dark-layout :deep(.note) {
  color: #d1d5db !important;
}

/* 业务页浅色文字、灰字 */
.admin-layout.dark-layout :deep(.text-muted),
.admin-layout.dark-layout :deep(.text-gray),
.admin-layout.dark-layout :deep(.text-secondary),
.admin-layout.dark-layout :deep(.muted),
.admin-layout.dark-layout :deep(.gray),
.admin-layout.dark-layout :deep(.secondary) {
  color: #9ca3af !important;
}

/* 业务页表格 */
.admin-layout.dark-layout :deep(.el-table),
.admin-layout.dark-layout :deep(table) {
  background: #111827 !important;
  color: #e5e7eb !important;
}

.admin-layout.dark-layout :deep(.el-table th.el-table__cell),
.admin-layout.dark-layout :deep(table th) {
  background: #1f2937 !important;
  color: #f9fafb !important;
  border-color: #374151 !important;
}

.admin-layout.dark-layout :deep(.el-table td.el-table__cell),
.admin-layout.dark-layout :deep(table td) {
  background: #111827 !important;
  color: #d1d5db !important;
  border-color: #272e3b !important;
}

.admin-layout.dark-layout :deep(.el-table__body tr:hover > td),
.admin-layout.dark-layout :deep(table tr:hover > td) {
  background: #1f2937 !important;
}

/* 业务页表单输入框 */
.admin-layout.dark-layout :deep(.el-input__wrapper),
.admin-layout.dark-layout :deep(.el-select__wrapper),
.admin-layout.dark-layout :deep(.el-textarea__inner),
.admin-layout.dark-layout :deep(input),
.admin-layout.dark-layout :deep(textarea),
.admin-layout.dark-layout :deep(select) {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
  border-color: #374151 !important;
  box-shadow: none !important;
}

.admin-layout.dark-layout :deep(.el-input__inner),
.admin-layout.dark-layout :deep(.el-select__input),
.admin-layout.dark-layout :deep(input::placeholder),
.admin-layout.dark-layout :deep(textarea::placeholder) {
  color: #e5e7eb !important;
}

/* 业务页按钮 */
.admin-layout.dark-layout :deep(.el-button),
.admin-layout.dark-layout :deep(button) {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
  border-color: #374151 !important;
}

.admin-layout.dark-layout :deep(.el-button:hover),
.admin-layout.dark-layout :deep(button:hover) {
  background-color: #374151 !important;
  color: #ffffff !important;
}

/* 业务页标签 / 状态标签 */
.admin-layout.dark-layout :deep(.el-tag),
.admin-layout.dark-layout :deep(.tag),
.admin-layout.dark-layout :deep(.badge),
.admin-layout.dark-layout :deep(.status-tag) {
  background-color: #1f2937 !important;
  color: #e5e7eb !important;
  border-color: #374151 !important;
}

/* 业务页分割线 */
.admin-layout.dark-layout :deep(.el-divider),
.admin-layout.dark-layout :deep(hr),
.admin-layout.dark-layout :deep(.divider),
.admin-layout.dark-layout :deep(.line) {
  border-color: #1f2937 !important;
}

/* 业务页下拉框弹层 */
.admin-layout.dark-layout :deep(.el-popper),
.admin-layout.dark-layout :deep(.el-dropdown-menu),
.admin-layout.dark-layout :deep(.el-select-dropdown) {
  background-color: #111827 !important;
  color: #e5e7eb !important;
  border-color: #1f2937 !important;
}

.admin-layout.dark-layout :deep(.el-dropdown-menu__item),
.admin-layout.dark-layout :deep(.el-select-dropdown__item) {
  color: #e5e7eb !important;
}

.admin-layout.dark-layout :deep(.el-dropdown-menu__item:hover),
.admin-layout.dark-layout :deep(.el-select-dropdown__item:hover) {
  background-color: #1f2937 !important;
  color: #ffffff !important;
}

/* 业务页分页 */
.admin-layout.dark-layout :deep(.el-pager li),
.admin-layout.dark-layout :deep(.el-pagination button) {
  background: #1f2937 !important;
  color: #e5e7eb !important;
  border-color: #374151 !important;
}

.admin-layout.dark-layout :deep(.el-pager li.is-active) {
  background: linear-gradient(90deg, #312e81, #4c1d95) !important;
  color: #ffffff !important;
}

/* 业务页空状态 */
.admin-layout.dark-layout :deep(.el-empty),
.admin-layout.dark-layout :deep(.empty) {
  background: #111827 !important;
  color: #9ca3af !important;
}


/* 最后兜底：所有业务区域内的白色背景强制转暗色 */
.admin-layout.dark-layout .content * {
  background-color: transparent;
  border-color: transparent;
  color: inherit;
}

.admin-layout.dark-layout .content :deep([style*="background-color: #fff"]),
.admin-layout.dark-layout .content :deep([style*="background-color: white"]),
.admin-layout.dark-layout .content :deep([style*="background:#fff"]),
.admin-layout.dark-layout .content :deep([style*="background:white"]) {
  background-color: #111827 !important;
}

.admin-layout.dark-layout .content :deep([style*="background-color: #ffffff"]),
.admin-layout.dark-layout .content :deep([style*="background:#ffffff"]) {
  background-color: #111827 !important;
}



</style>
