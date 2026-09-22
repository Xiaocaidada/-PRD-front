<template>
  <div class="bid-page">
    <!-- ============ Banner 轮播（导航栏正下方） ============ -->
    <div class="banner-wrap" v-if="bannerState !== 'empty'">
      <div v-if="bannerState === 'loading' || bannerState === 'error'" class="banner-box banner-skeleton">
        <div class="banner-skeleton-inner"></div>
      </div>
      <div v-else class="banner-box" @mouseenter="bannerHover = true" @mouseleave="bannerHover = false">
        <div class="banner-viewport">
          <div class="banner-track" :style="{ transform: `translateX(-${bannerIndex * 100}%)` }">
            <div v-for="b in banners" :key="b.id" class="banner-slide" @click="onBannerClick(b)">
              <img :src="b.imageUrl" :alt="b.title" class="banner-img" />
            </div>
          </div>
        </div>
        <button v-if="banners.length > 1" class="banner-arrow left" :class="{ show: bannerHover }" @click="bannerPrev">&#10094;</button>
        <button v-if="banners.length > 1" class="banner-arrow right" :class="{ show: bannerHover }" @click="bannerNext">&#10095;</button>
        <div class="banner-dots" v-if="banners.length > 1">
          <span v-for="(b, i) in banners" :key="b.id" class="banner-dot" :class="{ active: i === bannerIndex }" @click="bannerGo(i)"></span>
        </div>
      </div>
    </div>

    <!-- ============ 滚动通知快讯栏（Banner 下方） ============ -->
    <div v-if="noticesState !== 'empty'" class="notice-bar" @mouseenter="noticeHover = true" @mouseleave="noticeHover = false" @click="onNoticeClick">
      <span class="notice-icon">&#128226;</span>
      <span class="notice-error" v-if="noticesState === 'error'">公告加载失败，请稍后重试</span>
      <span v-else class="notice-viewport" ref="noticeViewportEl">
        <span class="notice-track" :class="{ scrolling: noticeOverflow && !noticeHover }" :style="{ animationDuration: noticeDuration }">
          <span class="notice-item">{{ currentNotice && currentNotice.title }}</span>
          <span v-if="noticeOverflow" class="notice-item" aria-hidden="true">{{ currentNotice && currentNotice.title }}</span>
          <span v-if="currentNotice && currentNotice.linkUrl" class="notice-arrow">&#8599;</span>
        </span>
      </span>
    </div>

    <!-- ============ 市集场次列表（单列） ============ -->
    <div class="page-head">
      <h3>市集场次竞标</h3>
    </div>
    <div v-if="loading" class="state-box" v-loading="true"></div>
    <div v-else-if="markets.length === 0" class="state-box">暂无竞标中的市集</div>
    <div v-else class="market-list">
      <div v-for="m in markets" :key="m.id" class="market-row">
        <!-- 布局缩略图 -->
        <!-- 市集图片缩略图（替代布局简图，点击放大） -->
        <div class="row-thumb" title="点击放大查看">
          <el-image v-if="m.imageUrl" :src="m.imageUrl" :preview-src-list="[m.imageUrl]" preview-teleported fit="cover" class="thumb-img" />
         <div v-else class="row-thumb" title="点击查看布局" @click="viewLayout(m)">
          <div class="thumb-canvas" :style="thumbCanvasStyle(m)">
            <div v-for="(e, i) in layoutElements(m)" :key="i" :class="{'thumb-el': true, taken: isTaken(e), mine: isMine(e), chosen: isChosen(e) }" :style="thumbElStyle(m, e)">
              <span v-if="isStallLike(e)" class="thumb-no">{{ stallNo(e) }}</span>
              <span v-else class="thumb-zone">{{ e.name }}</span>
            </div>
          </div>
        </div>
        </div>

        <!-- 信息区 -->
        <div class="row-info">
          <div class="row-title">
            <span class="m-name" title="点击查看详情" @click="openDetail(m)">{{ m.name }}</span>
            <el-tag size="small" :type="bidTagType(m.bidState)">{{ bidStateText(m.bidState) }}</el-tag>
          </div>
          <div class="m-meta">
            <div><el-icon><Calendar /></el-icon>{{ fmtDate(m.startDate) }} 至 {{ fmtDate(m.endDate) }}</div>
            <div><el-icon><Location /></el-icon>{{ m.location }}</div>
          </div>
          <div class="m-stats">
            共 {{ m.stallCount }} 个摊位 · 剩余可竞标 <b>{{ m.remainCount }}</b> 个
          </div>
        </div>
        <!-- 操作区 -->
        <div class="row-actions">
          <el-button size="small" @click="openDetail(m)">详情</el-button>
          <el-button size="small" type="primary"
                     :disabled="m.bidState !== 'OPEN'"
                     @click="openBidForm(m)">
            {{ m.bidState === 'OPEN' ? '去竞标' : (m.bidState === 'ENDED' ? '竞标已结束' : '暂未开放竞标') }}
          </el-button>
        </div>
      </div>
    </div>
    <!-- ============ 场次详情弹窗（含场次信息与我的竞标） ============ -->
    <el-dialog  append-to-body
  :z-index="9999"  v-model="detailVisible" title="市集详情" width="620px" top="6vh" destroy-on-close>
      <div v-if="detailData" class="detail-body">
        <div class="detail-row">
          <label>市集名称</label>
          <span class="detail-name">{{ detailData.name }}</span>
        </div>
        <div class="detail-row">
          <label>活动时间</label>
          <span>{{ fmtDate(detailData.startDate) }} 至 {{ fmtDate(detailData.endDate) }}</span>
        </div>
        <div class="detail-row">
          <label>活动地点</label>
          <span>{{ detailData.location }}</span>
        </div>
        <div class="detail-row">
          <label>活动声明</label>
          <span class="detail-stmt">{{ detailData.statement || '暂无' }}</span>
        </div>
        <!-- 我的竞标（并入详情） -->
        <div class="detail-bids">
          <div class="detail-bids-title">我的竞标</div>
          <div v-if="detailMyBids.length === 0" class="bids-empty">暂无竞标记录</div>
          <el-table v-else :data="detailMyBids" size="small" stripe>
            <el-table-column prop="stallNo" label="摊位编号" width="100" />
            <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="bidStatusTag(row.status)">{{ bidStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="提交时间" width="150" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="detailVisible = false">关闭</el-button>
        <el-button size="small" type="primary"
                   :disabled="!detailData || detailData.bidState !== 'OPEN'"
                   @click="openBidFromDetail">去竞标</el-button>
      </template>
    </el-dialog>
    <!-- ========== 发起竞标弹窗【已嵌入材料组件】 ========== -->
    <el-dialog  
  :z-index="9999"  v-model="bidVisible" title="发起竞标" width="820px" top="3vh" destroy-on-close>
      <div class="bid-dialog-wrap">
        <div v-if="currentMarket" class="bid-market-info">
          <b>{{ currentMarket.name }}</b> · {{ fmtDate(currentMarket.startDate) }} 至 {{ fmtDate(currentMarket.endDate) }}
        </div>
        <div v-if="hasNoLayout" class="state-box">本期市集暂未配置布局，可先按报名流程竞标</div>
        <el-form v-else label-width="80px">
          <el-form-item label="目标摊位" required>

            <el-button size="small" @click="openBidSelectDialog">选择摊位</el-button>

            <!-- 当前商户已被批准选摊位标签 -->
            <div class="bid-selected-tags" v-if="myStalls&&myStalls.length">已被批准摊位:
              <el-tag v-for="item in myStalls" :key="item" ">{{item}}</el-tag>
            </div>
<!-- 当前竞技摊位 -->
            <div class="bid-selected-tags" v-if="chosenStalls&&chosenStalls.length">正在竞选摊位:
              <el-tag v-for="item in chosenStalls" :key="item" closable @close="removeChosen(item)">{{item}}</el-tag>
            </div>

          </el-form-item>
          <el-form-item label="商户信息">
            <div class="merchant-info">
              <span>商户名称：{{ profile.name || '-' }}</span>
              <span>联系方式：{{ profile.phone || '-' }}</span>
            </div>
          </el-form-item>
          <el-form-item label="竞标备注">
            <el-input v-model="remark" type="textarea" :rows="3" maxlength="200" show-word-limit
                      placeholder="补充说明（选填，≤200字）" />
          </el-form-item>
        </el-form>

        <!-- ===== 嵌入竞选材料组件 ===== -->
        <el-divider content-position="left">竞选材料提交</el-divider>
        <BidMaterial ref="materialRef" />
      </div>

      <template #footer>
        <el-button size="small" @click="bidVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="submitting" :disabled="hasNoLayout || chosenStalls.length === 0" @click="submitBid">提交竞标</el-button>
      </template>
    </el-dialog>
    <!-- ============【新增】竞标-选择摊位子弹窗 ============ -->
    <el-dialog  append-to-body
  :z-index="9999" v-model="bidSelectVisible" title="选择竞标摊位" width="85%" top="4vh" destroy-on-close>
      <div class="bid-select-wrap">
        <div class="bid-select-left">
          <div class="zoom-bar small">
            <el-button size="small" :disabled="bidZoom <= 0.5" @click="bidZoomOut">缩小</el-button>
            <span class="zoom-pct">{{ Math.round(bidZoom * 100) }}%</span>
            <el-button size="small" :disabled="bidZoom >=3" @click="bidZoomIn">放大</el-button>
            <el-button size="small" @click="resetBidView">复位</el-button>
          </div>
          <div class="layout-viewport bid-viewport"
               @wheel.prevent="handleBidWheel"
               @mousedown="handleMouseDown"
               @mousemove="handleMouseMove"
               @mouseup="handleMouseUp"
               @mouseleave="handleMouseUp">
            <!-- 动画容器，缩放平移全部在这里做过渡 -->
            <div class="bid-canvas-stage" :class="{dragging: isDragging}"
                 :style="{transform:`translate(${bidStageTransform.x}px,${bidStageTransform.y}px) scale(${bidStageTransform.scale})`}">
              <div class="layout-canvas" :style="bidZoomCanvasStyle(currentLayout)">
                <div v-for="(e,i) in currentLayoutElements" :key="i" class="layout-el"
                     :class="{ taken: isTaken(e), mine: isMine(e), chosen: isChosen(e) }"
                     :style="getBidLayoutElStyle(e)"
                     @click="onPickEl(e)">
                  <span v-if="isStallLike(e) && !isChosen(e)" class="layout-no">{{ stallNo(e) }}</span>
                  <span v-else class="layout-zone">{{ e.name }}</span>
                  <span v-if="isStallLike(e) && isTaken(e)" class="taken-mark">已被选</span>
                  <span v-if="isStallLike(e) && isChosen(e)" class="check-mark">✓</span>
                </div>
              </div>
            </div>
          </div>
          <div class="layout-legend small">
            <span><i class="dot free"></i>可竞标</span>
            <span><i class="dot taken"></i>已被选</span>
            <span><i class="dot mine"></i>我竞标的</span>
            <span><i class="dot chosen-dot"></i>我的选择</span>
            <span><i class="dot aisle"></i>过道</span>
            <span><i class="dot building"></i>建筑</span>
          </div>
        </div>
        <!--右侧我的选择面板 -->
        <div class="bid-select-right">
          <h4 class="side-title">我的选择</h4>
          <div class="chosen-list">
            <div v-for="no in chosenStalls" :key="no" class="chosen-item">
              <span class="green-dot"></span>
              摊位 {{ no }}
            </div>
            <div v-if="chosenStalls.length===0" class="empty-tip">请点击左侧摊位进行选择</div>
          </div>
          <div class="count-text">已选 {{ chosenStalls.length }} 个摊位</div>
          <el-button class="clear-chosen-btn" size="small" @click="chosenStalls = []">清空选择</el-button>
          <el-divider/>
          <div class="legend-desc">
            <div><span class="dot free"></span>摊位·可预订</div>
            <div><span class="dot aisle"></span>过道</div>
            <div><span class="dot building"></span>建筑</div>
            <div><span class="dot chosen-dot"></span>我的选择</div>
          </div>
          <div class="tip-text">
            说明：点击橙色摊位即可选中/取消。<br>
            过道与建筑不可预订。
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="confirmBidSelect">确定选择</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, computed, nextTick ,watch} from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Location } from '@element-plus/icons-vue'
import BidMaterial from './BidMaterial.vue'
import { getMarketsForBid, getMarketDetail, submitMarketBids, getProfile,getPublicBanners, getPublicNotices } from '../../api'
const markets = ref([])
const loading = ref(false)
const profile = ref({})
const detailVisible = ref(false)
const detailData = ref(null)
const layoutVisible = ref(false)
const bidVisible = ref(false)
const submitting = ref(false)
const layoutError = ref(false)
const currentMarket = ref(null)
const currentLayout = ref({ canvasWidth: 210, canvasHeight: 297, background: '', elements: [] })
const takenStalls = ref([])
const myStalls = ref([])
const chosenStalls = ref([])
const remark = ref()
const zoom = ref(1)
const materialRef = ref(null)
// 竞标弹窗内部独立缩放，不和查看布局弹窗共用zoom
const bidZoom = ref(1)
// ============ 画布拖拽平移变量 ============
const bidPan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
// 动画transform状态
const bidStageTransform = ref({x:0,y:0,scale:1})
const bidZoomIn = () => {
  bidZoom.value = Math.min(3, Math.round((bidZoom.value+0.25)*100)/100)
  bidStageTransform.value.scale = bidZoom.value
}
const bidZoomOut = () => {
  bidZoom.value = Math.max(0.5, Math.round((bidZoom.value-0.25)*100)/100)
  bidStageTransform.value.scale = bidZoom.value
}
const bidSelectVisible = ref(false)
// ========== 竞标画布背景，移除translate，translate交给外层动画容器 ==========
const bidZoomCanvasStyle = (l) => {
  const w = l.canvasWidth || 210
  const h = l.canvasHeight || 297
  const z = bidZoom.value
  return {
    width: `${z *100}%`,
    maxWidth: 520 * z,
    aspectRatio: `${w}/${h}`,
    background: l.background ? `url(${l.background}) center/cover no-repeat` : '#faf3e4',
    position:'relative',
    margin:'0 auto'
  }
}


// ============ Banner 轮播 ============
const banners = ref([])
const bannerIndex = ref(0)
const bannerHover = ref(false)
const bannerState = ref('loading') // loading/ready/error/empty
let bannerTimer = null

const stopBannerTimer = () => { if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null } }
const startBannerTimer = () => {
  stopBannerTimer()
  if (banners.value.length > 1 && !bannerHover.value) {
    bannerTimer = setInterval(() => {
      if (!bannerHover.value) bannerIndex.value = (bannerIndex.value + 1) % banners.value.length
    }, 5000)
  }
}
const loadBanners = async () => {
  bannerState.value = 'loading'
  try {
    const res = await getPublicBanners()
    banners.value = res.data || []
    bannerIndex.value = 0
    bannerState.value = banners.value.length ? 'ready' : 'empty'
    startBannerTimer()
  } catch (e) {
    bannerState.value = 'error'
  }
}
const bannerGo = (i) => { bannerIndex.value = i; startBannerTimer() }
const bannerPrev = () => { bannerIndex.value = (bannerIndex.value - 1 + banners.value.length) % banners.value.length; startBannerTimer() }
const bannerNext = () => { bannerIndex.value = (bannerIndex.value + 1) % banners.value.length; startBannerTimer() }
const onBannerClick = (b) => { if (b.linkUrl) window.open(b.linkUrl, '_blank') }


// ============ 滚动快讯栏 ============
const notices = ref([])
const noticeIndex = ref(0)
const noticeHover = ref(false)
const noticesState = ref('loading') // loading/ready/error/empty
const noticeOverflow = ref(false)
const noticeDuration = ref('12s')
const noticeViewportEl = ref(null)
let noticeTimer = null
const currentNotice = computed(() => notices.value[noticeIndex.value] || null)

const stopNoticeTimer = () => { if (noticeTimer) { clearInterval(noticeTimer); noticeTimer = null } }
const startNoticeTimer = () => {
  stopNoticeTimer()
  if (notices.value.length > 1 && !noticeHover.value) {
    noticeTimer = setInterval(() => {
      if (!noticeHover.value) {
        noticeIndex.value = (noticeIndex.value + 1) % notices.value.length
      }
    }, 4000)
  }
}
const measureNotice = async () => {
  await nextTick()
  const vp = noticeViewportEl.value
  if (!vp || !currentNotice.value) { noticeOverflow.value = false; return }
  const track = vp.querySelector('.notice-track')
  if (!track) { noticeOverflow.value = false; return }
  const single = track.querySelector('.notice-item')
  if (!single) { noticeOverflow.value = false; return }
  const textW = single.scrollWidth
  const boxW = vp.clientWidth
  if (textW > boxW) {
    noticeOverflow.value = true
    // 80px/s：单份文字宽度 / 80
    const dur = Math.max(6, Math.round(textW / 80 * 10) / 10)
    noticeDuration.value = dur + 's'
  } else {
    noticeOverflow.value = false
  }
}
const loadNotices = async () => {
  noticesState.value = 'loading'
  try {
    const res = await getPublicNotices()
    notices.value = (res.data || []).filter(n => n && n.title && n.title.trim())
    noticeIndex.value = 0
    noticesState.value = notices.value.length ? 'ready' : 'empty'
    startNoticeTimer()
    measureNotice()
  } catch (e) {
    noticesState.value = 'error'
  }
}
const onNoticeClick = () => {
  const n = currentNotice.value
  if (n && n.linkUrl) window.open(n.linkUrl, '_blank')
}

watch([noticeHover, noticeIndex], () => {
  startNoticeTimer()
  measureNotice()
})
watch(bannerHover, () => startBannerTimer())

// ============ 滚轮、拖拽事件 ============
const handleBidWheel = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.08 : 0.08
  let next = bidZoom.value + delta
  next = Math.max(0.5, Math.min(3, next))
  bidZoom.value = Math.round(next * 100) / 100
  bidStageTransform.value.scale = bidZoom.value
}
const handleMouseDown = (e) => {
  if(e.button !== 0) return
  isDragging.value = true
  dragStart.value.x = e.clientX - bidPan.value.x
  dragStart.value.y = e.clientY - bidPan.value.y
}
const handleMouseMove = (e) => {
  if(!isDragging.value) return
  bidPan.value.x = e.clientX - dragStart.value.x
  bidPan.value.y = e.clientY - dragStart.value.y
  //拖拽过程实时更新，dragging状态关闭css过渡，不会有拖影
  bidStageTransform.value.x = bidPan.value.x
  bidStageTransform.value.y = bidPan.value.y
}
const handleMouseUp = () => {
  isDragging.value = false
}
//复位视图：缩放+位置平滑回到原点
const resetBidView = ()=>{
  bidZoom.value = 1
  bidPan.value = {x:0,y:0}
  bidStageTransform.value = {x:0,y:0,scale:1}
}
//打开摊位选择弹窗
const openBidSelectDialog = ()=>{

  resetBidView()
  bidSelectVisible.value = true
}
//确认摊位选择，关闭子弹窗
const confirmBidSelect = () => {
  bidSelectVisible.value = false
}
//标签移除单个摊位
const removeChosen = (stallNo)=>{
  const idx = chosenStalls.value.indexOf(stallNo)
  if(idx>-1) chosenStalls.value.splice(idx,1)
}
// ===== 方块格式辅助（新版 booth/aisle/building + 兼容旧版 stall/zone）=====
const TYPE_COLOR = { booth: '#f97316', aisle: '#e5e7eb', building: '#6b7280', chosen: '#279e47' }
const isStallLike = (e) => e && (e.type === 'booth' || e.type === 'stall')
const isBlockType = (e) => e && (e.type === 'booth' || e.type === 'aisle' || e.type === 'building')
const stallNo = (e) => e.stallNo || e.name || ''
const elColor = (e) => (e.color || TYPE_COLOR[e.type]) || (e.fill || 'rgba(229,231,235,0.6)')
//【重点】竞标选择弹窗元素样式：选中摊位背景变为绿色，取消红色外框
const getBidLayoutElStyle = (e) => {
  const w = currentLayout.value.canvasWidth || 210
  const h = currentLayout.value.canvasHeight || 297
  let bgColor = elColor(e)
  // 如果是摊位并且被选中，背景改成绿色
  if(isStallLike(e) && isChosen(e)){
    bgColor = TYPE_COLOR.chosen
  }
  if (isBlockType(e)) {
    return {
      position: 'absolute',
      left: `${(e.x / w) * 100}%`,
      top: `${(e.y / h) * 100}%`,
      width: `${(54 / w) * 100}%`,
      height: `${(54 / h) * 100}%`,
      background: bgColor,
      border: e.type === 'aisle' ? '1px dashed #9ca3af' : '1px solid rgba(0,0,0,0.28)',
      borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box',
      // 选中状态文字黑色，普通状态白色
      color: isStallLike(e) && isChosen(e) ? '#000000' : '#ffffff'
    }
  }
  return {
    position: 'absolute',
    left: `${(e.x / w) * 100}%`,
    top: `${(e.y / h) * 100}%`,
    width: `${(e.width / w) * 100}%`,
    height: `${(e.height / h) * 100}%`,
    background: bgColor,
    border: e.type === 'stall' ? '1px solid #9ca3af' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box'
  }
}
// ============ 场次列表 ============
const loadMarkets = async () => {
  loading.value = true
  try {
    const res = await getMarketsForBid()
    markets.value = res.data || []
    console.log("market list:",res.data)
  } catch (e) { /* 拦截器已提示 */ } finally {
    loading.value = false
  }
}
// ============ 场次详情（含我的竞标） ============
const detailMyBids = computed(() => (detailData.value && detailData.value.myBids) || [])
const openDetail = async (m) => {
  try {
    const res = await getMarketDetail(m.id)
    detailData.value = res.data
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('详情加载失败')
  }
}
const openBidFromDetail = () => {
  const m = detailData.value
  detailVisible.value = false
  openBidForm(m)
}
// ============ 布局 ============
const layoutElements = (m) => {
  const l = m.layout || {}
  try {
    const arr = l.elements
    return Array.isArray(arr) ? arr : []
  } catch (e) { return [] }
}
const thumbCanvasStyle = (m) => {
  const l = m.layout || {}
  const w = l.canvasWidth || 210
  const h = l.canvasHeight || 297
  return {
    width: '100%',
    aspectRatio: `${w} / ${h}`,
    background: l.background ? `url(${l.background}) center/cover no-repeat` : '#faf3e4',
    position: 'relative'
  }
}
const thumbElStyle = (m, e) => {
  const l = m.layout || {}
  const w = l.canvasWidth || 210
  const h = l.canvasHeight || 297
  if (isBlockType(e)) {
    return {
      position: 'absolute',
      left: `${(e.x / w) * 100}%`,
      top: `${(e.y / h) * 100}%`,
      width: `${(54 / w) * 100}%`,
      height: `${(54 / h) * 100}%`,
      background: elColor(e),
      border: e.type === 'aisle' ? '1px dashed #9ca3af' : '1px solid rgba(0,0,0,0.28)',
      borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box',
      color: e.type === 'aisle' ? '#9ca3af' : '#fff'
    }
  }
  return {
    position: 'absolute',
    left: `${(e.x / w) * 100}%`,
    top: `${(e.y / h) * 100}%`,
    width: `${(e.width / w) * 100}%`,
    height: `${(e.height / h) * 100}%`,
    background: elColor(e),
    border: e.type === 'stall' ? '1px solid #9ca3af' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box'
  }
}
const currentLayoutElements = computed(() => {
  try {
    const arr = currentLayout.value.elements
    return Array.isArray(arr) ? arr : []
  } catch (e) { return [] }
})
const hasNoLayout = computed(() => {
  const l = currentLayout.value || {}
  const els = l.elements
  return !(Array.isArray(els) && els.length > 0)
})
// ============ 布局查看 ============
const viewLayout = async (m) => {
  layoutError.value = false
  zoom.value = 1
  try {
    const res = await getMarketDetail(m.id)
    const d = res.data
    currentMarket.value = m
    currentLayout.value = d.layout || {}
    takenStalls.value = d.takenStalls || []
    myStalls.value = (d.myBids || []).map((b) => b.stallNo)
    layoutVisible.value = true
  } catch (e) {
    layoutError.value = true
    ElMessage.error('布局加载失败')
  }
}
const isTaken = (e) => isStallLike(e) && takenStalls.value.includes(stallNo(e)) && !myStalls.value.includes(stallNo(e))
const isMine = (e) => isStallLike(e) && myStalls.value.includes(stallNo(e))
const isChosen = (e) => isStallLike(e) && chosenStalls.value.includes(stallNo(e))
//打开竞标表单
const openBidForm = async (m) => {
  layoutError.value = false
  try {
    const res = await getMarketDetail(m.id)
    const d = res.data
    console.log(res)
    currentMarket.value = m
    currentLayout.value = d.layout || {}
    takenStalls.value = d.takenStalls || []
    myStalls.value = (d.myBids || []).map((b) => b.stallNo)
    chosenStalls.value = (d.myPending || []).map((b) => b.stallNo)
    remark.value = ''
    bidVisible.value = true
    // 弹窗打开后刷新竞选材料列表
    nextTick(()=>{
      materialRef.value?.reset()
    })
  } catch (e) {
    layoutError.value = true
    ElMessage.error('加载失败，请重试')
  }
}
const onPickEl = (e) => {
  // 拖拽状态直接返回，防止拖拽松开误触发点击
  if(isDragging.value) return
  if (!isStallLike(e)) {
    ElMessage.warning('过道 / 建筑区域不可竞标')
    return
  }
  // ============新增判断：我已经竞标的摊位，禁止再次点击操作============
  if (isMine(e)) {
    ElMessage.warning(`摊位 ${stallNo(e)} 已经竞标的摊位，禁止再次点击操作`)
    return
  }
  if (isTaken(e)) {
    ElMessage.warning(`摊位 ${stallNo(e)} 已被其他商户竞标，请选择其他摊位`)
    return
  }
  const no = stallNo(e)
  const idx = chosenStalls.value.indexOf(no)
  if (idx >= 0) chosenStalls.value.splice(idx, 1)
  else {
     if(chosenStalls.value.length>=3){
      ElMessage.warning("最多只能选3个")
      return
     }
    chosenStalls.value.push(no)
  }
}


const submitBid = async () => {
  console.log("submit")
  if (chosenStalls.value.length === 0) {
    ElMessage.warning('请选择目标摊位')
    return
  }
  submitting.value = true
  try {
    const materialList = materialRef.value?.getMaterialData() || []
    console.log("material:", materialList)

    // ========== 构造JSON请求对象 ==========
    const bidData = {
      stallNos: chosenStalls.value, // 数组，多个摊位号
      remark: remark.value?.trim() || null,
      materials: materialList       // 材料数组，里面包含module、content、urls（url字符串数组）
    }
    console.log("bid提交对象：", bidData)

    // 直接传对象，axios自动转为json，请求头application/json
    await submitMarketBids(currentMarket.value.id, bidData)

    ElMessage.success('竞标已提交，等待管理员审核')
    bidVisible.value = false
    loadMarkets()
    materialRef.value?.clearAll()
    openDetail({ id: currentMarket.value.id })
  } catch (e) {
    console.error('提交竞标失败', e)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}



// ============ 展示辅助 ============
const fmtDate = (d) => d ? String(d).slice(0, 10) : ''
const bidStateText = (s) => ({ OFF: '未开启', OPEN: '竞标中', ENDED: '已结束' })[s] || s
const bidTagType = (s) => ({ OFF: 'info', OPEN: 'success', ENDED: 'warning' })[s] || 'info'
const bidStatusText = (s) => ({ PENDING: '待审核', APPROVED: '已中标', REJECTED: '未中标' })[s] || s
const bidStatusTag = (s) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' })[s] || 'info'
onMounted(async () => {
  loadMarkets()
  loadBanners()
  loadNotices()
  try {
    const res = await getProfile()
    profile.value = res.data
  } catch (e) { /* 忽略 */ }
})
</script>
<style scoped>
/*主弹窗选中标签*/
.bid-selected-tags{
  margin-top:8px;
  display:flex;
  flex-wrap:wrap;
  gap:6px;
}
.bid-dialog-wrap{
  /* max-height:72vh;
  overflow-y:auto; */
  padding-right:6px;
}
/*子弹窗布局*/
.bid-select-wrap{
  display:flex;
  gap:20px;
  height: 60vh;
}
.bid-select-left{
  flex:1;
}
.bid-viewport{
  max-height:46vh;
  overflow: hidden !important;
  cursor: grab;
}
/*画布动画容器*/
.bid-canvas-stage{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  transform-origin:center center;
  will-change: transform;
  transition: transform 0.28s ease;
}
/*拖拽的时候关闭过渡，拖拽丝滑不卡顿*/
.bid-canvas-stage.dragging{
  transition:none;
}
.bid-viewport .layout-canvas.dragging{
  cursor: grabbing;
  user-select: none;
}
.bid-select-right{
  width:280px;
  flex-shrink:0;
  background:#faf3e4;
  border-radius:10px;
  padding:16px;
}
.side-title{
  margin:0 0 12px;
  color:#8b572a;
  font-size:18px;
}
.chosen-list{
  min-height:120px;
  max-height:220px;
  overflow-y:auto;
}
.chosen-item{
  display:flex;
  align-items:center;
  background:#fff8e8;
  padding:8px 10px;
  border-radius:6px;
  margin-bottom:6px;
}
.green-dot{
  width:10px;
  height:10px;
  background:#279e47;
  border-radius:2px;
  margin-right:8px;
}
.empty-tip{
  text-align:center;
  color:#999;
  padding:24px 0;
  font-size:13px;
}
.count-text{
  margin:10px 0;
  font-weight:500;
  font-size:14px;
}
.clear-chosen-btn{
  width:100%;
  background:#ff7b25;
  color:#fff;
  border:none;
}
.check-mark{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  font-weight:bold;
  font-size:16px;
}
.dot.chosen-dot{
  background:#279e47;
}
.zoom-bar.small{
  margin-bottom:8px;
}
.layout-legend.small{
  margin-top:10px;
  font-size:12px;
  gap:10px;
  justify-content:flex-start;
}
.legend-desc{
  margin:14px 0;
  display:flex;
  flex-direction:column;
  gap:6px;
  font-size:13px;
  color:#555;
}
.tip-text{
  margin-top:10px;
  font-size:12px;
  color:#777;
  line-height:1.6;
}
/* ===== Banner 轮播 ===== */
.banner-wrap { margin-bottom: 12px; }
.banner-box {
  position: relative; width: 100%; aspect-ratio: 3 / 1;
  border-radius: 14px; overflow: hidden; background: #eaf3ff;
}
.banner-skeleton { display:flex; align-items:center; justify-content:center; }
.banner-skeleton-inner {
  width: 100%; height: 100%;
  background: linear-gradient(100deg, #dbeafe 30%, #eff6ff 50%, #dbeafe 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.banner-viewport { width: 100%; height: 100%; overflow: hidden; }
.banner-track { display: flex; height: 100%; transition: transform 0.5s ease; }
.banner-slide { min-width: 100%; height: 100%; cursor: pointer; }
.banner-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.banner-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.85); color: #1f2937; font-size: 16px;
  cursor: pointer; opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease;
  z-index: 2; line-height: 1;
}
.banner-arrow:hover { transform: translateY(-50%) scale(1.1); background: #fff; }
.banner-arrow.show { opacity: 1; }
.banner-arrow.left { left: 14px; }
.banner-arrow.right { right: 14px; }
.banner-dots {
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px; z-index: 2;
}
.banner-dot {
  width: 8px; height: 8px; border-radius: 999px; background: #fff;
  opacity: 0.9; cursor: pointer; transition: all 0.25s ease;
}
.banner-dot.active { width: 22px; background: #2563eb; }
/* ===== 快讯栏 ===== */
.notice-bar {
  display: flex; align-items: center; gap: 10px;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 0 14px; height: 38px; margin-bottom: 14px;
  overflow: hidden; cursor: pointer;
}
.notice-icon { flex-shrink: 0; font-size: 16px; }
.notice-error { color: #64748b; font-size: 13px; }
.notice-viewport { flex: 1; overflow: hidden; height: 24px; display: flex; align-items: center; }
.notice-track {
  display: inline-flex; align-items: center; white-space: nowrap;
  font-size: 13px; color: #334155;
}
.notice-track.scrolling { animation-name: marquee; animation-timing-function: linear; animation-iteration-count: infinite; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.notice-item { padding-right: 2em; }
.notice-arrow { color: #2563eb; margin-left: 2px; }
/* ===== 市集图片缩略图 ===== */
.thumb-img { width: 200px; height: 120px; border-radius: 8px; display: block; }
.thumb-empty {
  width: 200px; height: 120px; border-radius: 8px;
  background: #f1f5f9; color: #94a3b8; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.bid-page { }
.page-head h3 { font-size: 18px; color: #1f2937; margin: 0 0 16px; }
.state-box { text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 14px; }
/* 单列场次列表 */
.market-list { display: flex; flex-direction: column; gap: 14px; }
.market-row {
  display: flex; align-items: center; gap: 18px;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 14px 18px; transition: box-shadow 0.2s;
}
.market-row:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
.row-thumb {
  width: 200px; flex-shrink: 0; cursor: pointer;
  border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;
  background: #f8fafc;
}
.row-info { flex: 1; min-width: 0; }
.row-title { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.m-name {
  font-size: 16px; font-weight: 700; color: #1f2937;
  cursor: pointer; transition: color 0.15s;
}
.m-name:hover { color: #2563eb; }
.m-meta { font-size: 13px; color: #6b7280; display: flex; flex-direction: column; gap: 5px; margin-bottom: 8px; }
.m-meta .el-icon { vertical-align: -2px; margin-right: 4px; }
.m-stats { font-size: 13px; color: #6b7280; }
.m-stats b { color: #2563eb; }
.row-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
/* 场次详情 */
.detail-body { display: flex; flex-direction: column; gap: 14px; }
.detail-row { display: flex; gap: 14px; font-size: 14px; }
.detail-row label {
  flex-shrink: 0; width: 72px; color: #9ca3af;
  text-align: right; line-height: 1.6;
}
.detail-row > span { color: #1f2937; line-height: 1.6; word-break: break-all; }
.detail-name { font-weight: 600; }
.detail-bids { margin-top: 6px; padding-top: 14px; border-top: 1px dashed #e5e7eb; }
.detail-bids-title { font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 10px; }
.bids-empty { font-size: 13px; color: #9ca3af; padding: 14px 0; text-align: center; }
/* 布局查看 */
.zoom-bar {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; margin-bottom: 12px;
}
.zoom-pct { font-size: 13px; color: #374151; min-width: 46px; text-align: center; }
.layout-viewport {
  max-height: 58vh;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #faf3e4;
  padding: 12px;
}
.layout-body { }
.layout-canvas { }
/*摊位点击选中动画*/
.layout-el {
  cursor: pointer;
  position: relative;
  transition: background-color 0.22s ease, transform 0.18s ease;
}
.layout-el:active{
  transform:scale(0.94);
}
.layout-el.chosen{
  transform:scale(1.04);
}
.layout-el.taken { opacity: 0.45; cursor: not-allowed; filter: grayscale(1); }
.layout-el.mine { outline: 2px solid #2563eb; }
.layout-no {
  font-size: 10px;
  font-weight: 700;
}
.layout-zone { font-size: 10px; color: #000000; }
.taken-mark {
  position: absolute; left: 0; right: 0; bottom: 1px;
  font-size: 8px; line-height: 13px; color: #6b7280;
  text-align: center; background: rgba(255,255,255,0.65);
  border-radius: 0 0 4px 4px;
}
.layout-legend { display: flex; gap: 18px; justify-content: center; margin-top: 14px; font-size: 13px; color: #6b7280; flex-wrap: wrap; }
.dot { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 4px; vertical-align: -1px; }
.dot.free { background: #f97316; }
.dot.taken { background: #f3f4f6; border: 1px solid #d1d5db; }
.dot.mine { background: #bfdbfe; border: 1px solid #2563eb; }
.dot.aisle { background: #e5e7eb; border: 1px dashed #9ca3af; }
.dot.building { background: #6b7280; }
.bid-market-info { font-size: 14px; color: #374151; margin-bottom: 14px; }
.bid-layout { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #fafafa; }
.chosen-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.chosen-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;
  border-radius: 6px; padding: 2px 8px; font-size: 13px;
}
.chosen-tag .el-icon { cursor: pointer; }
.merchant-info { display: flex; gap: 24px; font-size: 13px; color: #374151; }
.muted { color: #9ca3af; font-size: 13px; }
</style>

