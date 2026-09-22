<template>
  <div class="assign-page">
    <!-- 市集场次选择栏 保留在最顶部 -->
    <div class="panel">
      <div class="market-select-bar">
        <el-button size="small" @click="prevMarket" :disabled="marketIndex <= 0">上一个市集</el-button>
        <span class="label">选择市集场次：</span>
        <el-select v-model="selectedMarketId" placeholder="请选择市集" @change="onMarketChange" style="width:360px">
          <el-option v-for="m in marketList" :key="m.id" :label="m.name" :value="m.id"/>
        </el-select>
        <el-button size="small" @click="nextMarket" :disabled="marketIndex >= marketList.length -1">下一个市集</el-button>
      </div>
    </div>
    <!-- 左右分栏容器 -->
    <div class="flex-row-container">
      <!-- 左侧：摊位平面图（宽度50%） -->
      <div class="panel panel-left">
        <div class="panel-head">
          <h3>摊位平面图</h3>
          <div class="legend">
            <span><i class="dot orange"></i>可用</span>
            <span><i class="dot gray"></i>占用</span>
            <span><i class="dot blue"></i>选中摊位</span>
          </div>
        </div>
        <div class="zoom-bar">
          <el-button size="small" :disabled="stallZoom <= 0.5" @click="stallZoomOut">缩小</el-button>
          <span class="zoom-pct">{{ Math.round(stallZoom * 100) }}%</span>
          <el-button size="small" :disabled="stallZoom >=3" @click="stallZoomIn">放大</el-button>
          <el-button size="small" @click="resetStallView">复位</el-button>
        </div>
        <div class="layout-viewport stall-viewport"
             @wheel.prevent="handleStallWheel"
             @mousedown="handleStallMouseDown"
             @mousemove="handleStallMouseMove"
             @mouseup="handleStallMouseUp"
             @mouseleave="handleStallMouseUp">
          <div class="stall-canvas-stage" :class="{dragging: isStallDragging}"
               :style="{transform:`translate(${stallStageTransform.x}px,${stallStageTransform.y}px) scale(${stallZoom})`}">
            <div class="layout-canvas" :style="stallZoomCanvasStyle(currentLayout)">
              <div v-for="(e,i) in currentLayoutElements" :key="i" class="layout-el"
                   :class="{ occupied: isTaken(e), candidate: isCandidate(e), selected: selectedInfoStall === e }"
                   :style="getStallLayoutElStyle(e)"
                   @click="selectStallForInfo(e)"
              >
                <span v-if="isStallLike(e)" class="layout-no">{{ stallNo(e) }}</span>
                <span v-else class="layout-zone">{{ e.name }}</span>
                <span v-if="isStallLike(e) && isStallOccupied(e)" class="stall-occupant">{{ getStallOccupant(e) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧面板：统计卡片 + 饼图 + 摊位详情 -->
      <div class="panel panel-right">
        <h3>摊位数据统计</h3>
        <div class="stat-card-wrap">
          <div class="stat-item">
            <div class="stat-num">{{ stat.total }}</div>
            <div class="stat-label">总摊位</div>
          </div>
          <div class="stat-item stat-free">
            <div class="stat-num">{{ stat.free }}</div>
            <div class="stat-label">空闲</div>
          </div>
          <div class="stat-item stat-used">
            <div class="stat-num">{{ stat.used }}</div>
            <div class="stat-label">已占用</div>
          </div>
          <div class="stat-item stat-candidate">
            <div class="stat-num">{{ stat.candidate }}</div>
            <div class="stat-label">竞标中</div>
          </div>
        </div>
        <!-- 新增饼图区域 -->
        <div class="pie-wrap">
          <div ref="pieRef" style="width:100%;height:220px;"></div>
        </div>
        <div class="divider-line"></div>
        <h3>摊位详情</h3>
        <div v-if="selectedInfoStall" class="stall-info-card">
          <p><b>摊位编号：</b>{{ stallNo(selectedInfoStall) }}</p>
          <p><b>状态：</b>
            <el-tag v-if="isTaken(selectedInfoStall)" type="info">已占用</el-tag>
            <el-tag v-else-if="isCandidate(selectedInfoStall)" type="primary">竞标中</el-tag>
            <el-tag v-else-if="selectedInfoStall.type!='booth'" type="primary">不可用</el-tag>
            <el-tag v-else type="warning">空闲可用</el-tag>
          </p>
          <p v-if="isTaken(selectedInfoStall)"><b>商户：</b>{{ getStallOccupant(selectedInfoStall) }}</p>
          <p><b>坐标：</b> X:{{selectedInfoStall.x}}, Y:{{selectedInfoStall.y}}</p>
        </div>
        <el-empty v-else description="点击左侧摊位查看详情" :image-size="80"></el-empty>
      </div>
    </div>
    <!-- 待分配商户 -->
    <div class="panel">
      <h3>摊位竞选表</h3>
      <el-table :data="candidates" size="small" stripe>
        <el-table-column prop="name" label="商户" width="120" />
        <el-table-column prop="licenseNo" label="证件号" width="200" />
        <el-table-column prop="categories" label="品类" />
        <el-table-column prop="stallNo" label="竞标摊位" width="200"/>
        <el-table-column label="申报材料" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openMaterialDialog(row)">查看材料</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="200"/>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="pickFor(row)">分配</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!candidates.length" description="暂无可分配商户" :image-size="60" />
    </div>
    <!-- 修改摊位表 -->
    <div class="panel">
      <h3>商户修改请求表</h3>
      <el-table :data="updateBody" size="small" stripe>
        <el-table-column prop="name" label="商户" width="120" />
        <el-table-column prop="licenseNo" label="证件号" width="200" />
        <el-table-column prop="categories" label="品类" />
        <el-table-column prop="stallNo" label="竞标摊位" width="200"/>
        <el-table-column label="申报材料" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openMaterialDialog(row)">查看材料</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="200"/>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="pickFor(row)">分配</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!updateBody.length" description="暂无修改请求商户" :image-size="60" />
    </div>
    <!-- 已分配商户 -->
    <div class="panel">
      <h3>已分配商户</h3>
      <el-table :data="assigned" size="small" stripe>
        <el-table-column prop="name" label="商户" width="120" />
        <el-table-column prop="licenseNo" label="证件号" width="200" />
        <el-table-column prop="categories" label="品类" />
        <el-table-column label="摊位" width="120">
          <template #default="{ row }">{{ row.stallNo }}</template>
        </el-table-column>
        <el-table-column label="申报材料" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openMaterialDialog(row)">查看材料</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" link @click="release(row)">释放摊位</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 分配弹窗 -->
    <el-dialog v-model="assignVisible" title="分配摊位" width="85%" top="4vh">
      <p class="assign-info">
        为商户 <b>{{ selectedMerchant?.name }}</b> 分配摊位<br />
        请点击平面图中 <b>可用</b> 的摊位
      </p>
      <div class="zoom-bar">
        <el-button size="small" :disabled="dialogZoom <= 0.5" @click="dialogZoomOut">缩小</el-button>
        <span class="zoom-pct">{{ Math.round(dialogZoom * 100) }}%</span>
        <el-button size="small" :disabled="dialogZoom >=3" @click="dialogZoomIn">放大</el-button>
        <el-button size="small" @click="resetDialogView">复位</el-button>
      </div>
      <div class="layout-viewport stall-viewport"
           @wheel.prevent="handleDialogWheel"
           @mousedown="handleDialogMouseDown"
           @mousemove="handleDialogMouseMove"
           @mouseup="handleDialogMouseUp"
           @mouseleave="handleDialogMouseUp">
        <div class="stall-canvas-stage" :class="{dragging: isDialogDragging}"
             :style="{transform:`translate(${dialogStageTransform.x}px,${dialogStageTransform.y}px) scale(${dialogZoom})`}">
          <div class="layout-canvas" :style="dialogZoomCanvasStyle(currentLayout)">
            <div v-for="(e,i) in currentLayoutElements" :key="i" class="layout-el"
                 :class="{
                   occupied: isTaken(e),
                   candidate: isCandidate(e),
                   selected: isChosen(e)
                 }"
                 :style="getStallLayoutElStyle(e)"
                 @click="onPickEl(e)">
              <span v-if="isStallLike(e)" class="layout-no">{{ stallNo(e) }}</span>
              <span v-else class="layout-zone">{{ e.name }}</span>
              <span v-if="isStallLike(e) && isStallOccupied(e)" class="stall-occupant">{{ getStallOccupant(e) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="chosenStall" class="target-tip">
        已选择：<el-tag type="success">{{ chosenStall }}</el-tag>
      </div>
      <template #footer>
        <el-button @click="handleCancel()">取消</el-button>
        <el-button type="primary" :disabled="!chosenStall" :loading="assigning" @click="doAssign">确认分配</el-button>
      </template>
    </el-dialog>
    <!-- 商户材料弹窗 -->
    <el-dialog v-model="materialDialogVisible" title="商户申报材料" width="70%">
      <el-table :data="currentMerchantMaterial" stripe border>
        <el-table-column prop="module" label="材料模块" width="140"/>
        <el-table-column prop="content" label="备注说明"/>
        <el-table-column label="上传文件列表">
          <template #default="{ row }">
            <div class="file-list-wrap">
              <div v-for="(url, idx) in row.filePath" :key="idx" class="file-item" @click="previewFile(url)">
                <!-- 判断是否为图片后缀 -->
                <div v-if="isImageFile(url)" class="file-image-box">
                  <el-image
                    :src="url"
                    fit="cover"
                    class="file-thumb"
                  />
                </div>
                <!-- 非图片，展示对应类型文件图标 + 文件名 -->
                <div v-else class="file-normal-box">
                  <span v-html="getFileSvgIcon(url)" style="width:28px;height:28px;display:block;"></span>
                  <span class="file-name">{{ getFileNameFromUrl(url) }}</span>
                </div>
                <div v-if="!row.filePath || row.filePath.length === 0" class="file-empty">
                  暂无附件
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!currentMerchantMaterial.length" description="暂无上传材料" />
    </el-dialog>
    <!-- ========== 新增：文件预览弹窗 ========== -->
    <el-dialog v-model="filePreviewDialogVisible" title="文件预览" width="90%" top="4vh">
      <div v-if="previewFileUrl" class="preview-container">
        <!-- 图片预览 -->
        <div v-if="previewFileType === 'image'" style="text-align:center;">
          <img :src="previewFileUrl" style="max-width:100%;max-height:75vh;" alt="预览图片"/>
        </div>
        <!-- PDF预览 -->
        <iframe
          v-else-if="previewFileType === 'pdf'"
          :src="previewFileUrl"
          style="width:100%;height:75vh;border:none;"
        ></iframe>
        <!-- office/其他文件：提示下载 -->
        <div v-else class="preview-tip">
          <el-icon size="40"><Document /></el-icon>
          <p>当前文件类型暂不支持在线预览</p>
          <el-button type="primary" @click="downloadPreviewFile">下载文件</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="filePreviewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMarketsForBid, selectCandidate, getUsers, assignStall, releaseStall, getStallStat,getAssigned } from '../../api'
//市集
const marketList = ref([])
const selectedMarketId = ref(null)
const marketIndex = ref(0)
//布局
const currentLayout = ref({ canvasWidth:210, canvasHeight:297, background: '', elements: [] })
// ==========【修复BUG：新增】==========
const currentLayoutElements = computed(() => currentLayout.value.elements)
const stalls = ref([])
const users = ref([])
const logs = ref([])
const selectedMerchant = ref(null)
const assignVisible = ref(false)
const assigning = ref(false)
//主画布缩放拖拽
const stallZoom = ref(1)
const stallStageTransform = ref({x:0,y:0})
const isStallDragging = ref(false)
const stallDragStart = ref({x:0,y:0})
//弹窗画布缩放拖拽
const dialogZoom = ref(1)
const dialogStageTransform = ref({x:0,y:0})
const isDialogDragging = ref(false)
const dialogDragStart = ref({x:0,y:0})
const takenStalls = ref([])
const candidateStalls = ref([])
const chosenStall = ref(null)
//商户列表
const candidates = ref([])
const assigned = ref([])
//材料弹窗
const materialDialogVisible = ref(false)
const currentMerchantMaterial = ref([])
//文件预览弹窗
const filePreviewDialogVisible = ref(false)
const previewFileUrl = ref('')
const previewFileType = ref('')
// 右侧选中摊位
const selectedInfoStall = ref(null)
const selectStallForInfo = (e) => {
  selectedInfoStall.value = e
}
// 摊位统计计算属性
const stat = computed(()=>{
  const stallList = currentLayout.value.elements.filter(item => isStallLike(item))
  const total = stallList.length
  const used = stallList.filter(item => isTaken(item)).length
  const candidate = stallList.filter(item => isCandidate(item)).length
  const free = total - used - candidate
  return { total, free, used, candidate }
})
const updateBody=ref([])
// ========== 饼图相关 ==========
const pieRef = ref(null)
let pieChart = null
// 初始化饼图
const initPie = ()=>{
  if(!pieRef.value) return
  pieChart = echarts.init(pieRef.value)
  renderPie()
}
//渲染饼图
const renderPie = ()=>{
  if(!pieChart) return
  const data = [
    {name:'空闲', value: stat.value.free, itemStyle:{color:'#fdba74'}},
    {name:'已占用', value: stat.value.used, itemStyle:{color:'#d1d5db'}},
    {name:'竞标中', value: stat.value.candidate, itemStyle:{color:'#93c5fd'}}
  ]
  const option = {
    tooltip:{trigger:'item'},
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left:'center'
    },
    series: [
      {
        name:'摊位分布',
        type:'pie',
        radius: ['30%','65%'],
        avoidLabelOverlap: false,
        itemStyle: {borderRadius:6},
        label:{show:true, formatter:'{b}:{c}'},
        data
      }
    ]
  }
  pieChart.setOption(option)
}
//监听统计数据变化，自动刷新饼图
watch(stat,()=>{
  nextTick(()=>renderPie())
},{deep:true})
const isStallLike = (e) => e && (e.type === 'booth' || e.type === 'stall')
const stallNo = (e) => e.stallNo || e.name || ''
const isTaken = (e) => isStallLike(e) && takenStalls.value.includes(stallNo(e))
const isCandidate = (e) => isStallLike(e) && candidateStalls.value.includes(stallNo(e))
const isChosen=(e)=>isStallLike(e) && chosenStall?.value === stallNo(e)
const isStallOccupied = (e) => {
  const sn = stallNo(e)
  const stallItem = stalls.value.find(s=>s.stallNo === sn)
  return stallItem && stallItem.status === 'OCCUPIED'
}
const getStallOccupant = (e) => {
  const sn = stallNo(e)
  const stallItem = stalls.value.find(s=>s.stallNo === sn)
  if(!stallItem || !stallItem.userId) return ''
  const user = users.value.find(u=>u.id === stallItem.userId)
  return user?.name || '未知商户'
}
//=====修改这里，移除内部百分比缩放=====
const stallZoomCanvasStyle = (l) => {
  return {
    width: `700px`,
    aspectRatio: `${l.canvasWidth} / ${l.canvasHeight}`,
    position:'relative'
  }
}
const dialogZoomCanvasStyle = (l) => {
  return {
    width: `700px`,
    aspectRatio: `${l.canvasWidth} / ${l.canvasHeight}`,
    position:'relative'
  }
}
const getStallLayoutElStyle = (e) => {
  const w = currentLayout.value.canvasWidth || 210
  const h = currentLayout.value.canvasHeight || 297
  let bgColor
  if(isStallLike(e)){
    if(isTaken(e)){
      bgColor = '#d1d5db' //已占用：柔和浅灰
    }else if(isCandidate(e)){
      bgColor = '#93c5fd' //竞标中：柔和浅蓝
    }else{
      bgColor = '#fdba74' //空闲：柔和浅橙
    }
  }else{
    bgColor = '#e5e7eb'
  }
  return {
    position: 'absolute',
    left: `${(e.x / w) * 100}%`,
    top: `${(e.y / h) * 100}%`,
    width: `${(54 / w) * 100}%`,
    height: `${(54 / h) * 100}%`,
    background: bgColor,
    border: e.type === 'aisle' ? '1px dashed #9ca3af' : '1px solid rgba(0,0,0,0.28)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    color: isStallLike(e) && isTaken(e) ? '#ffffff' : '#1f2937'
  }
}
//主画布缩放拖拽事件
const stallZoomIn = ()=>{ stallZoom.value = Math.min(3, stallZoom.value +0.1) }
const stallZoomOut = ()=>{ stallZoom.value = Math.max(0.5, stallZoom.value -0.1) }
const resetStallView = ()=>{
  stallZoom.value = 1
  stallStageTransform.value = {x:0,y:0}
}
// 判断是否图片文件
const isImageFile = (url) => {
  if(!url) return false
  const imgSuffix = ['png','jpg','jpeg','gif','webp','bmp']
  const ext = getFileExt(url)
  return imgSuffix.includes(ext)
}
// 获取文件后缀
const getFileExt = (url) => {
  if(!url) return ''
  const arr = url.split('.')
  return arr.pop().toLowerCase()
}
// 获取不同文件SVG图标
const getFileSvgIcon = (url) => {
  const ext = getFileExt(url)
  if(['pdf'].includes(ext)){
    return `<svg viewBox="0 0 24 24" fill="#e53e3e"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M14,10V3.5L18.5,9H14M8,13H15V14H8V13M8,16H13V17H8V16Z"/></svg>`
  } else if(['doc','docx'].includes(ext)){
    return `<svg viewBox="0 0 24 24" fill="#3182ce"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M14,10V3.5L18.5,9H14Z"/></svg>`
  } else if(['xls','xlsx'].includes(ext)){
    return `<svg viewBox="0 0 24 24" fill="#38a169"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M14,10V3.5L18.5,9H14Z"/></svg>`
  } else if(['ppt','pptx'].includes(ext)){
    return `<svg viewBox="0 0 24 24" fill="#dd6b20"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M14,10V3.5L18.5,9H14Z"/></svg>`
  }
  // 默认通用文件图标
  return `<svg viewBox="0 0 24 24" fill="#666"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" /></svg>`
}
// 【新增】从url提取文件名，不改动原始数据
const getFileNameFromUrl = (url) => {
  if(!url) return ''
  const arr = url.split('/')
  return arr[arr.length -1]
}
// 文件预览方法：图片/PDF打开弹窗，Office提示下载
const previewFile = (url) => {
  previewFileUrl.value = url
  const ext = getFileExt(url)
  if(isImageFile(url)){
    previewFileType.value = 'image'
  }else if(ext === 'pdf'){
    previewFileType.value = 'pdf'
  }else{
    previewFileType.value = 'other'
  }
  filePreviewDialogVisible.value = true
}
//下载文件
const downloadPreviewFile = () => {
  const a = document.createElement('a')
  a.href = previewFileUrl.value
  a.download = getFileNameFromUrl(previewFileUrl.value)
  document.body.appendChild(a)
  a.click()
  a.remove()
}
const handleStallWheel = (e)=>{
  if(e.deltaY < 0) stallZoomIn()
  else stallZoomOut()
}
const handleStallMouseDown = (e)=>{
  isStallDragging.value = true
  stallDragStart.value = {x:e.clientX - stallStageTransform.value.x, y:e.clientY - stallStageTransform.value.y}
}
const handleStallMouseMove = (e)=>{
  if(!isStallDragging.value) return
  stallStageTransform.value.x = e.clientX - stallDragStart.value.x
  stallStageTransform.value.y = e.clientY - stallDragStart.value.y
}
const handleStallMouseUp = ()=>{ isStallDragging.value = false }
//弹窗画布缩放拖拽
const dialogZoomIn = ()=>{ dialogZoom.value = Math.min(3, dialogZoom.value +0.1) }
const dialogZoomOut = ()=>{ dialogZoom.value = Math.max(0.5, dialogZoom.value -0.1) }
const resetDialogView = ()=>{
  dialogZoom.value =1
  dialogStageTransform.value={x:0,y:0}
}
const handleDialogWheel = (e)=>{
  if(e.deltaY <0) dialogZoomIn()
  else dialogZoomOut()
}
const handleDialogMouseDown = (e)=>{
  isDialogDragging.value = true
  dialogDragStart.value = {x:e.clientX - dialogStageTransform.value.x, y:e.clientY - dialogStageTransform.value.y}
}
const handleDialogMouseMove = (e)=>{
  if(!isDialogDragging.value) return
  dialogStageTransform.value.x = e.clientX - dialogDragStart.value.x
  dialogStageTransform.value.y = e.clientY - dialogDragStart.value.y
}
const handleDialogMouseUp = ()=>{ isDialogDragging.value = false }
const onPickEl = (e) => {
  if (!isStallLike(e)) {
    ElMessage.warning('过道区域不可选择')
    return
  }
  if (isTaken(e)) {
    ElMessage.warning(`摊位 ${stallNo(e)} 已被占用`)
    return
  }
  chosenStall.value = stallNo(e)
}
const handleCancel=()=>{
  assignVisible.value = false
  selectedMerchant.value = null
  chosenStall.value = null
}
const pickFor = (row) => {
  selectedMerchant.value = row
  assignVisible.value = true
  chosenStall.value = null
}
const doAssign = async () => {
  assigning.value = true
  try {
    await assignStall({ merchantId: selectedMerchant.value.id, stallNo: chosenStall.value, marketId: selectedMarketId.value })
    ElMessage.success('分配成功')
    await loadCurrentMarketData()
  } catch (err) {
    ElMessage.error('分配失败')
  } finally {
    assigning.value = false
    handleCancel()
  }
}
const release = async (row) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `确认释放商户「${row.name}」的摊位？\n请输入释放原因：`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：商户退租/违规清退/档期取消',
        inputValidator: (val) => {
          if (!val || val.trim() === '') {
            return '释放原因不能为空'
          }
          return true
        },
        inputErrorMessage: '释放原因不能为空'
      }
    )
    await releaseStall({ 
      stallNo: row.stallNo, 
      marketId: selectedMarketId.value,
      reason: reason.trim(),
      merchantId: row.id
    })
    ElMessage.success('释放成功')
    await loadCurrentMarketData()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('释放失败')
    }
  }
}
const openMaterialDialog = (row) => {
  currentMerchantMaterial.value = row.materialList || []
  materialDialogVisible.value = true
}
const prevMarket = () => {
  marketIndex.value--
  selectedMarketId.value = marketList.value[marketIndex.value].id
  onMarketChange()
}
const nextMarket = () => {
  marketIndex.value++
  selectedMarketId.value = marketList.value[marketIndex.value].id
  onMarketChange()
}
const onMarketChange = async () => {
  const idx = marketList.value.findIndex(m=>m.id === selectedMarketId.value)
  marketIndex.value = idx
  await loadCurrentMarketData()
}
const loadCurrentMarketData = async () => {
  assigned.value=[]
  candidates.value = []
  updateBody.value=  []
  currentLayout.value= marketList.value[marketIndex.value].layout
  const res = await getStallStat(selectedMarketId.value)
  takenStalls.value = res.data.taken || []
  candidateStalls.value = res.data.candidate || []
  stalls.value = res.stalls || []
  const candidateRes = await selectCandidate(selectedMarketId.value)
  const assignedRes = await getAssigned(selectedMarketId.value)

  for(const arr of Object.values(assignedRes.data) || []){
    assigned.value.push(arr[0])
  }


  console.log("candidate",candidates.value)
  console.log("updateBody",updateBody.value)
  console.log("assigned",assigned.value)

  
  const tp=[]
  for(const arr of Object.values(candidateRes.data) || []){
    const str_candidate=[]
    for(const item of arr){
      if(!str_candidate.includes(item.stallNo)){
        str_candidate.push(item.stallNo)
      }
    }
    tp.push({
      id: arr[0].id,
      stallNo: str_candidate.join(','),
      name: arr[0].name,
      licenseNo: arr[0].licenseNo,
      materialList: arr[0].materialList,
      categories: arr[0].categories,
      remark: arr[0].remark
    })
  }
  const assigned_ids=assigned.value.map(a=>a.id)
  for(const item of tp){
    if(assigned_ids.includes(item.id)){
      updateBody.value.push(item)
    }
    else{
      candidates.value.push(item)
    }
  }
  const userRes = await getUsers()
  users.value = userRes.data || []
}
const loadMarketList = async () => {
  const res = await getMarketsForBid()
  marketList.value = res.data || []
  console.log("marketList",marketList.value)
  if(marketList.value.length>0){
    selectedMarketId.value = marketList.value[0].id
    marketIndex.value =0
    await onMarketChange()
  }
}
onMounted(async ()=>{
  await loadMarketList()
  await nextTick()
  initPie()
})
//销毁echarts，释放资源
onUnmounted(()=>{
  pieChart?.dispose()
})
</script>
<style scoped>
.assign-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}
.panel h3 {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 14px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: #6b7280;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin-right: 4px;
  vertical-align: middle;
}
.dot.blue { background: #93c5fd; }
.dot.orange { background: #fdba74; border: 1px solid #fcd34d; }
.dot.gray { background: #d1d5db; }
.flex-row-container {
  display: flex;
  gap: 16px;
}
.panel-left, .panel-right {
  flex: 1;
}
/* 统计卡片 */
.stat-card-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap:12px;
}
.stat-item {
  padding:12px;
  background:#f6f7f9;
  border-radius:8px;
  text-align:center;
}
.stat-free { background:#ffedd5; }
.stat-used { background:#f3f4f6; }
.stat-candidate { background:#dbeafe; }
.stat-num {
  font-size:22px;
  font-weight:bold;
  color:#1f2937;
}
.stat-label {
  font-size:12px;
  color:#6b7280;
}
.divider-line {
  height:1px;
  background:#e5e7eb;
  margin:20px 0;
}
.stall-info-card {
  line-height:2;
}
.pie-wrap {
  margin-top:16px;
}
.market-select-bar{
  display:flex;
  align-items:center;
  gap:12px;
}
.label{
  font-weight:500;
  color:#333;
}
.zoom-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}
.zoom-pct {
  font-size: 13px;
  color: #374151;
  min-width: 46px;
  text-align: center;
}
.stall-viewport {
  max-height: 52vh;
  overflow: hidden !important;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #faf3e4;
  padding:12px;
  cursor: grab;
}
.stall-canvas-stage{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  transform-origin:center center;
  will-change: transform;
  transition: transform 0.28s ease;
}
.stall-canvas-stage.dragging{ transition:none; }
.layout-el {
  cursor: pointer;
  position: relative;
  transition: background-color 0.22s ease, transform 0.18s ease;
}
.layout-el:active{ transform:scale(0.94); }
.layout-el.candidate{
  transform:scale(1.04);
  outline:2px solid #2563eb;
}
.layout-el.selected{
  transform:scale(1.04);
  outline:2px solid #2563eb;
}
.layout-el.occupied {
  opacity: 1;
  cursor:not-allowed;
}
.layout-el.occupied .layout-no {
  color: #ffffff;
  font-weight: 800;
}
.layout-el.occupied .stall-occupant {
  color: #f9fafb;
}
.layout-no {
  font-size: 10px;
  font-weight: 700;
}
.layout-zone {
  font-size: 10px;
  color: #000000;
}
.stall-occupant{
  position:absolute;
  left:0;
  right:0;
  bottom:1px;
  font-size:8px;
  line-height:13px;
  color:#444;
  text-align:center;
}
.assign-info {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.9;
  margin-bottom: 14px;
}
.target-tip {
  font-size: 14px;
  color: #374151;
}
.file-list-wrap {
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  padding:6px 0;
}
.file-item {
  display: flex;
  align-items: center;
  /* 保留外框，内部图片取消边框 */
  padding: 4px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  flex-shrink: 0;
}
.file-thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  flex-shrink: 0;
}
.file-normal-box {
  display:flex;
  align-items:center;
  gap:6px;
  max-width:160px;
}
.file-name {
  font-size:12px;
  color:#333;
  white-space: nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.file-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 4px 0;
}
.preview-tip {
  text-align:center;
  padding:60px 0;
  color:#666;
}
/* 美化横向滚动条 */
.file-list-wrap::-webkit-scrollbar {
  height:4px;
}
.file-list-wrap::-webkit-scrollbar-thumb {
  background:#d1d5db;
  border-radius:4px;
}
</style>
