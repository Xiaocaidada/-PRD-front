import {request,admin_request} from './request'

// ========== 认证 ==========
export const getCaptcha = () => request.get('/captcha')
export const sendSms = (phone) => request.post('/auth/sms', { phone })
export const register = (data) => request.post('/auth/register', data)
export const login = (data) => request.post('/auth/login', data)
export const adminLogin = (data) => request.post('/auth/admin/login', data)

// ========== 公开 ==========
export const getLanding = () => request.get('/public/landing')
export const getNewsDetail = (id) => request.get(`/public/news/${id}`)
export const getPublicMerchant = (id) => request.get(`/public/merchant/${id}`)
export const getPublicBanners = () => request.get('/public/banners')

export const getPublicNotices = () => request.get('/public/notices')
// ========== 商户端 ==========
export const getCard = () => request.get('/merchant/card')
export const getMyMaterials = () => request.get('/merchant/materials')
export const submitMaterial = (formData) => request.post('/merchant/materials/submit', formData)
export const getStallMap = () => request.get('/merchant/stall-map')
export const saveBids = (stallIds) => request.post('/merchant/bids', { stallIds })
export const getMerchantStats = () => request.get('/merchant/stats')
export const getPayLink = () => request.get('/merchant/pay-link')
export const getMerchantNews = () => request.get('/merchant/news')
export const getProfile = () => request.get('/merchant/profile')
export const merchant_editCard = (id, data) => request.put(`/merchant/${id}/card`, data)

// ========== 管理端 ==========
export const get_all_status=()=>admin_request.get(`/admin/all_status`)
export const get_merchant_edit=(id)=>admin_request.get(`/admin/get_merchant_edit`,{params:{id}})

export const getUsers = (params) => admin_request.get('/admin/users', { params })
export const getUserDetail = (id) => admin_request.get(`/admin/users/${id}`)
export const approveUser = (id) => admin_request.post(`/admin/users/${id}/approve`)
export const rejectUser = (id, reason) => admin_request.post(`/admin/users/${id}/reject`, { reason })
export const getAdminMaterials = (params) => admin_request.get('/admin/materials', { params })
export const reviewMaterial = (data) => admin_request.post('/admin/materials/review', data)
export const editCard = (id, data) => admin_request.put(`/admin/merchants/${id}/card`, data)
export const getAdminStallMap = () => admin_request.get('/admin/stalls/map')
export const getAllBids = () => admin_request.get('/admin/stalls/bids')
export const assignStall = (data) => admin_request.post('/admin/market/stalls/assign', data)
export const releaseStall = (body) => admin_request.post('/admin/market/release', body)
export const getAssignLogs = () => admin_request.get('/admin/assign-logs')

export const getNewsList = (params) => admin_request.get('/admin/news', { params })
export const createNews = (data) => admin_request.post('/admin/news', data)
export const updateNews = (id, data) => admin_request.put(`/admin/news/${id}`, data)
export const offlineNews = (id) => admin_request.post(`/admin/news/${id}/offline`)
export const onlineNews = (id) => admin_request.post(`/admin/news/${id}/online`)
export const deleteNews = (id) => admin_request.delete(`/admin/news/${id}`)

export const getCategories = () => admin_request.get('/admin/categories')
export const createCategory = (data) => admin_request.post('/admin/categories', data)
export const updateCategory = (id, data) => admin_request.put(`/admin/categories/${id}`, data)
export const deleteCategory = (id) => admin_request.delete(`/admin/categories/${id}`)

export const getNavs = () => admin_request.get('/admin/navs')
export const createNav = (data) => admin_request.post('/admin/navs', data)
export const updateNav = (id, data) => admin_request.put(`/admin/navs/${id}`, data)
export const deleteNav = (id) => admin_request.delete(`/admin/navs/${id}`)

export const getBanners = () => admin_request.get('/admin/banners')
export const createBanner = (data) => admin_request.post('/admin/banners', data)
export const updateBanner = (id, data) => admin_request.put(`/admin/banners/${id}`, data)
export const deleteBanner = (id) => admin_request.delete(`/admin/banners/${id}`)

export const getRepresentatives = () => admin_request.get('/admin/representatives')
export const createRepresentative = (data) => admin_request.post('/admin/representatives', data)
export const updateRepresentative = (id, data) => admin_request.put(`/admin/representatives/${id}`, data)
export const deleteRepresentative = (id) => admin_request.delete(`/admin/representatives/${id}`)

export const getPartners = () => admin_request.get('/admin/partners')
export const createPartner = (data) => admin_request.post('/admin/partners', data)
export const updatePartner = (id, data) => admin_request.put(`/admin/partners/${id}`, data)
export const deletePartner = (id) => admin_request.delete(`/admin/partners/${id}`)

export const getAdminStats = () => admin_request.get('/admin/stats')
export const uploadImage = (formData) => admin_request.post('/admin/upload', formData)

// ========== 市集竞标(商户端) ==========
export const getMarketsForBid = () => request.get('/merchant/market/markets')
export const getMarketDetail = (id) => request.get(`/merchant/market/markets/${id}`)
export const submitMarketBids = (id,fd) => request.post(`/merchant/market/markets/${id}/bids`,fd)
export const getMyMarketBids = () => request.get('/merchant/market/my-bids')

export const upload=(formData)=>request.post("/merchant/upload",formData)

// ========== 市集布局模板(管理端) ==========
export const getLayoutTemplates = (params) => admin_request.get('/admin/layout-template/list', { params })
export const getLayoutTemplate = (id) => admin_request.get(`/admin/layout-template/${id}`)
export const createLayoutTemplate = (data) => admin_request.post('/admin/layout-template/create', data)
export const updateLayoutTemplate = (id, data) => admin_request.put(`/admin/layout-template/${id}`, data)
export const duplicateLayoutTemplate = (id) => admin_request.post(`/admin/layout-template/${id}/duplicate`)
export const toggleLayoutTemplate = (id, enable) => admin_request.post(`/admin/layout-template/${id}/toggle`, { enable })

// ========== 市集管理(管理端) ==========
export const getMarkets = (params) => admin_request.get('/admin/market/list', { params })
export const getMarket = (id) => admin_request.get(`/admin/market/${id}`)
export const createMarket = (data) => admin_request.post('/admin/market/create', data)
export const updateMarket = (id, data) => admin_request.put(`/admin/market/${id}`, data)
export const publishMarket = (id) => admin_request.post(`/admin/market/${id}/publish`)
export const offlineMarket = (id) => admin_request.post(`/admin/market/${id}/offline`)
export const toggleMarketBid = (id, bidEnabled) => admin_request.post(`/admin/market/${id}/bid-toggle`, { bidEnabled })

export const selectCandidate=(id) => admin_request.get(`/admin/market/candidate/${id}`)

export const getStallStat=(id)=> admin_request.get(`/admin/market/stat/${id}`)

export const getAssigned=(id)=> admin_request.get(`/admin/market/assigned/${id}`)

