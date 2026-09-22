import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'landing', component: () => import('../views/landing/Landing.vue') },
  { path: '/register', name: 'register', component: () => import('../views/auth/Register.vue') },
  { path: '/login', name: 'login', component: () => import('../views/auth/Login.vue') },
  { path: '/pay/:id', name: 'pay', component: () => import('../views/merchant/PayPage.vue') },
   // 在routes数组添加
{
  path: '/news/:id',
  name: 'newsDetail',
  component: () => import('../views/public/NewsDetailPage.vue'),
},
  {
    path: '/merchant',
    component: () => import('../views/merchant/MerchantLayout.vue'),
    meta: { requiresMerchantAuth: true }, // 改为商户专属权限标记
    children: [
      { path: '', redirect: '/merchant/card' },
      { path: 'card', name: 'merchantCard', component: () => import('../views/merchant/MerchantCard.vue') },
      { path: 'materials', name: 'merchantMaterials', component: () => import('../views/merchant/MaterialUpload.vue') },
      { path: 'stall', name: 'merchantStall', component: () => import('../views/merchant/StallBid.vue') },
      { path: 'new_stall', name: 'newMerchantStall', component: () => import('../views/merchant/NewStallBid.vue') },
      { path: 'news', name: 'merchantNews', component: () => import('../views/merchant/ActivityNotice.vue') },
      { path: 'stats', name: 'merchantStats', component: () => import('../views/merchant/StatsView.vue') },
      { path: 'edit', name: 'merchantEdit', component: () => import('../views/merchant/MerchantEdit.vue') },
    ]
  },
  { path: '/admin/login', name: 'adminLogin', component: () => import('../views/admin/AdminLogin.vue') },
{
  path: '/redirect',
  component: () => import('../views/admin/Redirect.vue'),
  meta: { hidden: true }
},
  ,
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdminAuth: true }, // 管理员专属权限标记
    children: [
      { path: '', redirect: '/admin/users' },
      { path: 'users', name: 'adminUsers', component: () => import('../views/admin/UserList.vue') },
      { path: 'users/:id', name: 'adminUserDetail', component: () => import('../views/admin/UserDetail.vue') },
      { path: 'stalls', name: 'adminStalls', component: () => import('../views/admin/StallAssign.vue') },
      { path: 'news', name: 'adminNews', component: () => import('../views/admin/NewsManage.vue') },
      { path: 'categories', name: 'adminCategories', component: () => import('../views/admin/CategoryManage.vue') },
      { path: 'navs', name: 'adminNavs', component: () => import('../views/admin/NavManage.vue') },
      { path: 'banners', name: 'adminBanners', component: () => import('../views/admin/BannerManage.vue') },
      { path: 'reps', name: 'adminReps', component: () => import('../views/admin/RepManage.vue') },
      { path: 'partners', name: 'adminPartners', component: () => import('../views/admin/PartnerManage.vue') },
      { path: 'stats', name: 'adminStats', component: () => import('../views/admin/StatsManage.vue') },
      { path: 'layout-templates', name: 'adminLayoutTemplates', component: () => import('../views/admin/LayoutTemplateList.vue') },
      { path: 'layout-editor', name: 'adminLayoutEditor', component: () => import('../views/admin/LayoutTemplateEditor.vue') },
      { path: 'markets', name: 'adminMarkets', component: () => import('../views/admin/MarketManage.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  // 管理员权限校验
  if (to.meta.requiresAdminAuth) {
    const adminToken = localStorage.getItem('admin_booth_token')
    const adminRole = localStorage.getItem("admin_booth_role")
    if (adminToken && adminRole === "ADMIN") {
      return next()
    } else {
      // 未登录或角色不对跳管理员登录
      return next({ path: "/admin/login", query: { redirect: to.fullPath } })
    }
  }

  // 商户权限校验
  if (to.meta.requiresMerchantAuth) {
    const cliToken = localStorage.getItem('booth_token')
    const cliRole = localStorage.getItem("booth_role")
    if (cliToken && cliRole === "MERCHANT") {
      return next()
    } else {
      // 未登录跳转商户登录页，记录跳转回来地址
      return next({ path: "/login", query: { redirect: to.fullPath } })
    }
  }

  // 不需要权限直接放行
  next()
})

export default router
