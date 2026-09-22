<template>
  <div class="market-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <span class="total">共 {{ total }} 期市集</span>
      <el-input v-model="filters.keyword" placeholder="按市集名称搜索" clearable style="width: 220px"
                @keyup.enter="load(1)" @clear="load(1)" />
      <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 150px" @change="load(1)">
        <el-option label="筹备中" value="PREPARING" />
        <el-option label="已发布" value="PUBLISHED" />
        <el-option label="进行中" value="ONGOING" />
        <el-option label="已结束" value="FINISHED" />
        <el-option label="已下线" value="OFFLINE" />
      </el-select>
      <el-button type="primary" class="create-btn" @click="openForm()">新建市集</el-button>
    </div>

    <!-- 列表表格 -->
    <div class="table-card">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="市集名称" min-width="140">
          <template #default="{ row }">
            <el-link type="primary" @click="showDetail(row)">{{ row.name }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" min-width="160" show-overflow-tooltip />
        <el-table-column label="活动时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.startDate) }} 至 {{ fmtDate(row.endDate) }}</template>
        </el-table-column>
        <el-table-column label="关联布局模板" width="160">
          <template #default="{ row }">
            <template v-if="row.templateName">
              {{ row.templateName }}
              <el-tag v-if="row.templateStatus === 'DISABLED'" size="small" type="info">已禁用</el-tag>
            </template>
            <span v-else class="muted">未设置</span>
          </template>
        </el-table-column>
        <el-table-column label="摊位总数" width="90">
          <template #default="{ row }">{{ row.stallCount ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="竞标状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="bidTagType(row.bidState)">{{ bidStateText(row.bidState) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="openForm(row)">编辑</el-button>
            <el-button size="small" link type="warning" @click="openBindForm(row)">
              {{ row.templateId ? '更换布局' : '绑定布局' }}
            </el-button>
            <el-button v-if="row.status === 'PREPARING' || row.status === 'OFFLINE'" size="small" link type="success"
                       @click="doPublish(row)">发布</el-button>
            <el-button v-if="row.status !== 'OFFLINE' && row.status !== 'FINISHED'" size="small" link type="danger"
                       @click="doOffline(row)">下线</el-button>
            <el-button v-if="row.status === 'PUBLISHED'" size="small" link
                       :type="row.bidEnabled ? 'danger' : 'success'" @click="doBidToggle(row)">
              {{ row.bidEnabled ? '关闭竞标' : '开启竞标' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination layout="total, sizes, prev, pager, next" :total="total"
                       :page-size="filters.size" :current-page="page"
                       :page-sizes="[20, 50, 100]" @size-change="onSizeChange" @current-change="load" />
      </div>
    </div>

    <!-- 新建/编辑表单 -->
    <el-dialog v-model="formVisible" :title="form.id ? '编辑市集' : '新建市集'" width="560px" destroy-on-close>
      <el-form :model="form" label-width="120px">
        <el-form-item label="市集名称" required>
          <el-input v-model="form.name" maxlength="30" show-word-limit placeholder="≤30字" />
        </el-form-item>
        <el-form-item label="举办地点" required>
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="活动时间" required>
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
                          start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="竞标报名截止">
          <el-date-picker v-model="form.bidDeadline" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                          placeholder="不填则竞标持续至活动开始" style="width: 100%" />
        </el-form-item>
        <el-form-item label="活动声明">
          <el-input v-model="form.statement" type="textarea" :rows="3" placeholder="活动规则说明，展示给商户端" />
        </el-form-item>


        <el-form-item label="市集图片">
          <el-upload
            :show-file-list="false"
            :http-request="()=>{}"
            :before-upload="beforeImageUpload"
            accept="image/*"
          >
            <el-button>上传图片</el-button>
          </el-upload>
          <div v-if="form.imageUrl" class="img-preview">
            <el-image :src="form.imageUrl" fit="cover" style="width:240px;height:135px;margin-top:8px;border-radius:6px" />
            <el-button link type="danger" size="small" @click="form.imageUrl=''">移除图片</el-button>
          </div>
          <div class="tip">横版图片，用于商户端场次卡片展示，点击可放大查看</div>
        </el-form-item>





        <el-form-item label="关联布局模板">
          <el-select v-model="form.templateId" placeholder="仅展示已启用模板" clearable style="width: 100%">
            <el-option v-for="t in enabledTemplates" :key="t.id" :label="`${t.name}（${t.stallCount || 0} 个摊位）`" :value="t.id" />
          </el-select>
          <div v-if="selectedTemplatePreview" class="tpl-preview">
            <div class="tpl-canvas" :style="previewCanvasStyle">
              <div v-for="(e, i) in selectedTemplateElements" :key="i" class="tpl-el" :style="previewElStyle(e)">
                <span v-if="e.type === 'stall' || e.type === 'booth'" class="tpl-no">{{ e.stallNo || e.name }}</span>
                <span v-if="e.type === 'aisle' || e.type === 'building'" class="tpl-no" style="color:#fff">{{ e.name }}</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="竞标开关">
          <el-switch v-model="form.bidEnabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="formVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 绑定布局弹窗 -->
    <el-dialog v-model="bindVisible" :title="bindForm.marketId ? '更换布局' : '绑定布局'" width="480px" destroy-on-close>
      <div v-if="bindWarn" class="warn-box">{{ bindWarn }}</div>
      <el-select v-model="bindForm.templateId" placeholder="选择已启用模板" clearable style="width: 100%">
        <el-option v-for="t in enabledTemplates" :key="t.id" :label="`${t.name}（${t.stallCount || 0} 个摊位）`" :value="t.id" />
      </el-select>
      <template #footer>
        <el-button size="small" @click="bindVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitBind">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="市集详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="市集名称">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="举办地点">{{ detail.location }}</el-descriptions-item>
        <el-descriptions-item label="活动时间">{{ fmtDate(detail.startDate) }} 至 {{ fmtDate(detail.endDate) }}</el-descriptions-item>
        <el-descriptions-item label="竞标截止">{{ detail.bidDeadline || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="关联模板">{{ detail.templateName || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="活动声明">{{ detail.statement || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMarkets, createMarket, updateMarket, publishMarket, offlineMarket, toggleMarketBid, getLayoutTemplates,uploadImage } from '../../api'

const list = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const filters = reactive({ keyword: '', status: '', size: 20 })

const enabledTemplates = ref([])

const formVisible = ref(false)
const dateRange = ref(null)
const form = reactive({ id: null, name: '', location: '', bidDeadline: null, statement: '', templateId: null, bidEnabled: 0 })

const bindVisible = ref(false)
const bindWarn = ref('')
const bindForm = reactive({ marketId: null, templateId: null })

const detailVisible = ref(false)
const detail = ref({})

const load = async (p) => {
  page.value = p || 1
  loading.value = true
  try {
    const params = { page: page.value, size: filters.size }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.status) params.status = filters.status
    const res = await getMarkets(params)
    list.value = res.data.records
    total.value = Number(res.data.total)
  } catch (e) { /* 拦截器已提示 */ } finally {
    loading.value = false
  }
}

const loadTemplates = async () => {
  try {
    const res = await getLayoutTemplates({ status: 'ENABLED' })
    enabledTemplates.value = res.data || []
  } catch (e) { /* 忽略 */ }
}

// ============ 表单 ============
const openForm = (row) => {
  formVisible.value = true
  dateRange.value = null
  Object.assign(form, { id: null, name: '', location: '', bidDeadline: null, statement: '', templateId: null, bidEnabled: 0 })
  if (row) {
    Object.assign(form, {
      id: row.id, name: row.name, location: row.location,
      bidDeadline: row.bidDeadline, statement: row.statement,
      templateId: row.templateId, bidEnabled: row.bidEnabled || 0
    })
    if (row.startDate && row.endDate) {
      dateRange.value = [row.startDate, row.endDate]
    }
  }
}
const beforeImageUpload = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  uploadImage(fd).then((res) => {
    form.imageUrl = res.data.url
    ElMessage.success('图片上传成功')
  }).catch(() => { /* 拦截器已提示 */ })
  return false
}
const submitForm = async () => {
  if (!form.name.trim()) { ElMessage.warning('请填写市集名称'); return }
  if (!form.location.trim()) { ElMessage.warning('请填写举办地点'); return }
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) { ElMessage.warning('请选择活动时间'); return }
  if (dateRange.value[1] < dateRange.value[0]) { ElMessage.warning('结束时间不能早于开始时间'); return }
  // 同名市集提示
  const same = list.value.find((m) => m.name === form.name.trim() && m.id !== form.id)
  if (same) {
    try {
      await ElMessageBox.confirm(`已存在同名市集「${form.name.trim()}」，是否继续保存？`, '名称重复', {
        confirmButtonText: '继续保存', cancelButtonText: '取消', type: 'warning'
      })
    } catch (e) {
      return
    }
  }
  const payload = {
    name: form.name.trim(),
    location: form.location.trim(),
    startDate: dateRange.value[0],
    endDate: dateRange.value[1],
    bidDeadline: form.bidDeadline || null,
    statement: form.statement || null,
    imageUrl: form.imageUrl || null,
    templateId: form.templateId || null,
    bidEnabled: form.bidEnabled
  }
  console.log("payload",payload)
  try {
    if (form.id) {
      await updateMarket(form.id, payload)
    } else {
      await createMarket(payload)
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    await load(page.value)
  } catch (e) { /* 拦截器已提示 */ }
}

// ============ 绑定/更换布局 ============
const openBindForm = (row) => {
  bindWarn.value = ''
  Object.assign(bindForm, { marketId: row.id, templateId: row.templateId || null })
  if (row.stallCount !== null && row.stallCount !== undefined) {
    bindWarn.value = '该市集已有竞标数据，更换布局可能影响已提交竞标的摊位位置，请谨慎操作。'
  }
  bindVisible.value = true
}

const submitBind = async () => {
  try {
    const row = list.value.find((m) => m.id === bindForm.marketId)
    if (!row) return
    await updateMarket(bindForm.marketId, {
      name: row.name, location: row.location,
      startDate: row.startDate, endDate: row.endDate,
      bidDeadline: row.bidDeadline, statement: row.statement,
      templateId: bindForm.templateId || null,
      bidEnabled: row.bidEnabled || 0
    })
    ElMessage.success('绑定成功')
    bindVisible.value = false
    await load(page.value)
  } catch (e) { /* 拦截器已提示 */ }
}

// ============ 发布/下线/竞标开关 ============
const doPublish = async (row) => {
  try {
    await ElMessageBox.confirm(`确认发布市集「${row.name}」？发布后商户端将展示该市集。`, '发布确认', {
      confirmButtonText: '发布', cancelButtonText: '取消', type: 'warning'
    })
  } catch (e) { return }
  try {
    await publishMarket(row.id)
    ElMessage.success('已发布')
    await load(page.value)
  } catch (e) { /* 拦截器已提示 */ }
}

const doOffline = async (row) => {
  try {
    await ElMessageBox.confirm(`确认下线市集「${row.name}」？下线后商户端将不再展示该市集，进行中的竞标将暂停。`, '下线确认', {
      confirmButtonText: '下线', cancelButtonText: '取消', type: 'warning'
    })
  } catch (e) { return }
  try {
    await offlineMarket(row.id)
    ElMessage.success('已下线')
    await load(page.value)
  } catch (e) { /* 拦截器已提示 */ }
}

const doBidToggle = async (row) => {
  const enable = !row.bidEnabled
  if (!enable) {
    try {
      await ElMessageBox.confirm('关闭后商户将无法提交新的竞标，已提交的竞标不受影响。', '关闭竞标', {
        confirmButtonText: '关闭', cancelButtonText: '取消', type: 'warning'
      })
    } catch (e) { return }
  } else {
    if (row.bidState === 'ENDED') {
      ElMessage.warning('已过竞标截止时间，无法开启竞标')
      return
    }
  }
  try {
    await toggleMarketBid(row.id, enable ? 1 : 0)
    ElMessage.success(enable ? '竞标已开启' : '竞标已关闭')
    await load(page.value)
  } catch (e) { /* 拦截器已提示 */ }
}

// ============ 详情 ============
const showDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

// ============ 模板预览 ============
const selectedTemplatePreview = computed(() => {
  const t = enabledTemplates.value.find((x) => x.id === form.templateId)
  return t
})

const selectedTemplateElements = computed(() => {
  const t = selectedTemplatePreview.value
  if (!t) return []
  try {
    const arr = JSON.parse(t.elements || '[]')
    return Array.isArray(arr) ? arr : []
  } catch (e) { return [] }
})

const previewCanvasStyle = computed(() => {
  const t = selectedTemplatePreview.value
  if (!t) return {}
  const w = t.canvasWidth || 210
  const h = t.canvasHeight || 297
  return {
    width: '100%',
    aspectRatio: `${w} / ${h}`,
    background: t.background ? `url(${t.background}) center/cover no-repeat` : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: t.background ? 'cover' : '10px 10px',
    position: 'relative'
  }
})

const previewElStyle = (e) => {
  const t = selectedTemplatePreview.value
  if (!t) return {}
  const w = t.canvasWidth || 210
  const h = t.canvasHeight || 297
  // 新版方块格式（booth/aisle/building）
  if (e.type === 'booth' || e.type === 'aisle' || e.type === 'building') {
    return {
      position: 'absolute',
      left: `${(e.x / w) * 100}%`,
      top: `${(e.y / h) * 100}%`,
      width: `${(54 / w) * 100}%`,
      height: `${(54 / h) * 100}%`,
      background: e.color || ({ booth: '#f97316', aisle: '#e5e7eb', building: '#6b7280' })[e.type] || '#f97316',
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
    background: e.type === 'stall' ? (e.color || '#d1d5db') : (e.fill || 'rgba(229,231,235,0.6)'),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: e.type === 'stall' ? '1px solid #9ca3af' : 'none'
  }
}

// ============ 展示辅助 ============
const onSizeChange = (s) => { filters.size = s; load(1) }
const fmtDate = (d) => d ? String(d).slice(0, 10) : ''
const statusText = (s) => ({ PREPARING: '筹备中', PUBLISHED: '已发布', ONGOING: '进行中', FINISHED: '已结束', OFFLINE: '已下线' })[s] || s
const statusTagType = (s) => ({ PREPARING: 'info', PUBLISHED: 'success', ONGOING: 'primary', FINISHED: 'warning', OFFLINE: 'danger' })[s] || 'info'
const bidStateText = (s) => ({ OFF: '未开启', OPEN: '竞标中', ENDED: '已结束' })[s] || s
const bidTagType = (s) => ({ OFF: 'info', OPEN: 'success', ENDED: 'warning' })[s] || 'info'

onMounted(() => { load(1); loadTemplates() })
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.total { font-size: 14px; color: #374151; font-weight: 500; }
.create-btn { margin-left: auto; }
.table-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
.pager { display: flex; justify-content: flex-end; margin-top: 16px; }
.muted { color: #9ca3af; }
.warn-box { background: #fef3c7; color: #92400e; font-size: 13px; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; }
.tpl-preview { margin-top: 10px; }
.tpl-canvas { border: 1px solid #e5e7eb; border-radius: 6px; max-width: 260px; }
.tpl-no { font-size: 9px; color: #374151; font-weight: 700; }
</style>
