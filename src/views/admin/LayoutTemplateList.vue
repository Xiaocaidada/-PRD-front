<template>
  <div class="layout-list">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <span class="total">共 {{ filteredTotal }} 个模板</span>
      <el-input v-model="keyword" placeholder="搜索模板名称..." clearable style="width: 260px"
                @input="applyFilter" @clear="applyFilter" />
      <el-select v-model="statusFilter" style="width: 140px" @change="applyFilter">
        <el-option label="全部状态" value="ALL" />
        <el-option label="已启用" value="ENABLED" />
        <el-option label="已禁用" value="DISABLED" />
      </el-select>
      <el-button type="primary" class="create-btn" @click="createTemplate">新建模板</el-button>
    </div>

    <!-- 加载失败 -->
    <div v-if="loadError" class="error-box">
      <p>模板列表加载失败</p>
      <el-button size="small" @click="load">重试</el-button>
    </div>

    <!-- 空态：无任何模板 -->
    <div v-else-if="!loading && templates.length === 0" class="empty-box">
      暂无市集布局模板，点击上方「新建模板」开始创建
    </div>

    <template v-else>
      <!-- 已启用区 -->
      <div v-if="showEnabled" class="section">
        <div class="section-title">已启用 {{ enabledList.length }}</div>
        <div v-if="enabledList.length === 0" class="section-empty">暂无启用的模板</div>
        <div v-else class="card-grid">
          <div v-for="t in enabledList" :key="t.id" class="tpl-card"
               @click="openEditor(t.id)">
            <div class="thumb">
              <div class="tpl-canvas" :style="canvasStyle(t)">
                <div v-for="(e, i) in parsedElements(t)" :key="i" class="tpl-el"
                     :style="elStyle(t, e)">
                  <span v-if="e.type === 'stall' || e.type === 'booth'" class="tpl-no">{{ e.stallNo || e.name }}</span>
                  <span v-if="e.type === 'zone' && e.showLabel !== false" class="tpl-zone-label">{{ e.name }}</span>
                  <span v-if="e.type === 'aisle' || e.type === 'building'" class="tpl-zone-label">{{ e.name }}</span>
                </div>
              </div>
              <span class="badge enabled">启用</span>
            </div>
            <div class="info">
              <div class="tpl-name">{{ t.name }}</div>
              <div class="tpl-meta">{{ t.stallCount || 0 }} 个摊位 · {{ fmtTime(t.updatedAt) }}</div>
              <div class="ops" @click.stop>
                <el-button size="small" @click="openEditor(t.id)">编辑</el-button>
                <el-button size="small" @click="duplicate(t)">复制</el-button>
                <el-button size="small" type="danger" plain @click="disable(t)">禁用</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已禁用区 -->
      <div v-if="showDisabled && disabledList.length > 0" class="section">
        <div class="section-title">已禁用 {{ disabledList.length }}</div>
        <div v-if="disabledList.length === 0" class="section-empty">暂无禁用的模板</div>
        <div v-else class="card-grid">
          <div v-for="t in disabledList" :key="t.id" class="tpl-card disabled"
               @click="openEditor(t.id)">
            <div class="thumb">
              <div class="tpl-canvas" :style="canvasStyle(t)">
                <div v-for="(e, i) in parsedElements(t)" :key="i" class="tpl-el"
                     :style="elStyle(t, e)">
                  <span v-if="e.type === 'stall' || e.type === 'booth'" class="tpl-no">{{ e.stallNo || e.name }}</span>
                  <span v-if="e.type === 'zone' && e.showLabel !== false" class="tpl-zone-label">{{ e.name }}</span>
                  <span v-if="e.type === 'aisle' || e.type === 'building'" class="tpl-zone-label">{{ e.name }}</span>
                </div>
              </div>
              <span class="badge disabled">已禁用</span>
            </div>
            <div class="info">
              <div class="tpl-name">{{ t.name }}</div>
              <div class="tpl-meta">{{ t.stallCount || 0 }} 个摊位 · {{ fmtTime(t.updatedAt) }}</div>
              <div class="ops" @click.stop>
                <el-button size="small" @click="openEditor(t.id)">编辑</el-button>
                <el-button size="small" @click="duplicate(t)">复制</el-button>
                <el-button size="small" type="success" plain @click="enable(t)">启用</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索空态 -->
      <div v-if="!loading && templates.length > 0 && filteredTotal === 0" class="empty-box">
        没有找到匹配的模板，试试其他关键词
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getLayoutTemplates, duplicateLayoutTemplate, toggleLayoutTemplate } from '../../api'

const router = useRouter()
const templates = ref([])
const keyword = ref('')
const statusFilter = ref('ALL')
const loading = ref(false)
const loadError = ref(false)

const applyFilter = () => {
  // keyword 由计算属性实时过滤，无需额外处理
}

const filtered = computed(() => {
  const kw = keyword.value.trim()
  let list = templates.value
  if (kw) {
    list = list.filter((t) => t.name && t.name.includes(kw))
  }
  if (statusFilter.value === 'ENABLED') {
    list = list.filter((t) => t.status === 'ENABLED')
  } else if (statusFilter.value === 'DISABLED') {
    list = list.filter((t) => t.status === 'DISABLED')
  }
  return list
})

const enabledList = computed(() => filtered.value.filter((t) => t.status === 'ENABLED'))
const disabledList = computed(() => filtered.value.filter((t) => t.status === 'DISABLED'))
const filteredTotal = computed(() => filtered.value.length)
const showEnabled = computed(() => statusFilter.value !== 'DISABLED')
const showDisabled = computed(() => statusFilter.value !== 'ENABLED')

const load = async () => {
  loading.value = true
  loadError.value = false
  try {
    const res = await getLayoutTemplates({})
    templates.value = res.data || []
  } catch (e) {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const createTemplate = () => {
  router.push('/admin/layout-editor?mode=create')
}

const openEditor = (id) => {
  router.push(`/admin/layout-editor?id=${id}`)
}

const duplicate = async (t) => {
  try {
    await ElMessageBox.confirm(`确认复制模板「${t.name}」？复制后将生成一份完全相同的副本。`, '复制确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await duplicateLayoutTemplate(t.id)
    ElMessage.success('复制成功')
    await load()
  } catch (e) { /* 拦截器已提示 */ }
}

const disable = async (t) => {
  let msg = `确认禁用模板「${t.name}」？禁用后该模板将不可用于新建市集绑定，已绑定该模板的市集不受影响。`
  if (t.marketCount > 0) {
    msg = `确认禁用模板「${t.name}」？该模板已绑定 ${t.marketCount} 期市集，禁用后这些市集不受影响。`
  }
  try {
    await ElMessageBox.confirm(msg, '禁用确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await toggleLayoutTemplate(t.id, false)
    ElMessage.success('已禁用')
    await load()
  } catch (e) { /* 拦截器已提示 */ }
}

const enable = async (t) => {
  try {
    await ElMessageBox.confirm(`确认启用模板「${t.name}」？启用后将恢复可用于新建市集绑定。`, '启用确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await toggleLayoutTemplate(t.id, true)
    ElMessage.success('已启用')
    await load()
  } catch (e) { /* 拦截器已提示 */ }
}

// ============ 缩略图渲染 ============
const parsedElements = (t) => {
  try {
    const arr = JSON.parse(t.elements || '[]')
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

const canvasStyle = (t) => {
  const w = t.canvasWidth || 210
  const h = t.canvasHeight || 297
  const bg = t.background || ''
  return {
    width: '100%',
    aspectRatio: `${w} / ${h}`,
    background: bg ? `url(${bg}) center/cover no-repeat` : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: bg ? 'cover' : '8px 8px',
    backgroundPosition: 'center',
    position: 'relative'
  }
}

const elStyle = (t, e) => {
  const w = t.canvasWidth || 210
  const h = t.canvasHeight || 297
  // 新版方块格式（booth/aisle/building）：x/y 为像素坐标，固定 54×54 方块
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      overflow: 'hidden',
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
    border: e.type === 'stall' ? '1px solid #9ca3af' : 'none',
    borderRadius: e.type === 'stall' ? '2px' : '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden'
  }
}

const fmtTime = (t) => {
  if (!t) return ''
  return String(t).replace('T', ' ').slice(0, 16)
}

onMounted(load)
</script>

<style scoped>
.layout-list { }
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.total { font-size: 14px; color: #374151; font-weight: 500; }
.create-btn { margin-left: auto; }

.section { margin-bottom: 24px; }
.section-title {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.section-empty { color: #9ca3af; font-size: 13px; padding: 20px; text-align: center; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.tpl-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.tpl-card:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
.tpl-card.disabled { opacity: 0.55; }

.thumb { position: relative; padding: 12px; background: #f8fafc; }
.tpl-canvas { border: 1px solid #e5e7eb; border-radius: 6px; }
.tpl-el { }
.tpl-no { font-size: 9px; color: #374151; font-weight: 700; }
.tpl-zone-label { font-size: 8px; color: #6b7280; }

.badge {
  position: absolute;
  top: 18px;
  right: 18px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #fff;
}
.badge.enabled { background: #22c55e; }
.badge.disabled { background: #9ca3af; }

.info { padding: 12px 14px; }
.tpl-name { font-size: 15px; font-weight: 600; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tpl-card.disabled .tpl-name { color: #9ca3af; }
.tpl-meta { font-size: 12px; color: #9ca3af; margin: 6px 0 10px; }
.ops { display: flex; gap: 8px; }

.error-box, .empty-box { text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 14px; }
.error-box .el-button { margin-top: 12px; }
</style>
