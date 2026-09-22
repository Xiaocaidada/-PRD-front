<template>
  <div class="editor">
    <!-- 顶栏 -->
    <div class="topbar">
      <div class="name-field">
        <span class="label">市集名称</span>
        <el-input v-model="marketName" placeholder="请输入市集名称" maxlength="30" style="width: 240px" clearable />
      </div>
      <el-button type="primary" size="small" @click="addSquare">+ 增加方块</el-button>
      <el-button type="danger" size="small" plain @click="removeSquare">删除方块</el-button>
      <div class="spacer" />
      <el-button type="primary" size="small" :loading="saving" @click="saveLayout">保存布局</el-button>
      <el-button size="small" @click="resetDefault">恢复默认</el-button>
    </div>

    <!-- 主体：画布 + 右侧属性面板 -->
    <div class="editor-body">
      <div class="canvas-panel">
        <div class="canvas-scroll">
          <div id="canvas" class="canvas">
            <div v-for="sq in squares" :key="sq.id"
                 class="sq"
                 :class="[sq.type, { selected: sq.id === selectedId }]"
                 :style="sqStyle(sq)"
                 :data-id="sq.id"
                 @mousedown.prevent="onSqMouseDown($event, sq)">
              {{ sq.name }}
            </div>
          </div>
        </div>
        <p class="canvas-hint">
          拖动方块可移动位置（自动吸附网格）· 点击方块在右侧设置属性。
          <br />点击「保存布局」会将布局保存到后台。
        </p>
      </div>

      <aside class="side">
        <h2>方块属性</h2>
        <div v-if="!selectedSq" class="prop-empty">
          还没有选中方块<br />点击画布中的方块开始编辑
        </div>
        <template v-else>
          <div class="prop-row">
            <label>方块类型</label>
            <div class="type-btns">
              <button v-for="t in typeKeys" :key="t" class="type-btn"
                      :class="{ active: selectedSq.type === t }"
                      @click="changeType(t)">
                <span class="dot" :style="{ background: typeMeta[t].color }"></span>{{ typeMeta[t].label }}
              </button>
            </div>
          </div>
          <div class="prop-row">
            <label>名称（可选，显示在方块上）</label>
            <el-input v-model="selectedSq.name" maxlength="8" placeholder="如 A01" @change="onNameChange" />
          </div>
          <div class="prop-row">
            <label>颜色</label>
            <div class="palette">
              <div v-for="c in palette" :key="c" class="sw"
                   :class="{ active: sqColor(selectedSq) === c }"
                   :style="{ background: c }" @click="selectedSq.color = c"></div>
            </div>
          </div>
          <div class="pos-info">
            编号 #{{ selectedSq.id }} · 位置 ({{ selectedSq.y / CELL + 1 }}, {{ selectedSq.x / CELL + 1 }}) 格
          </div>
        </template>

        <h2>图例</h2>
        <div class="legend">
          <div class="lg-item"><span class="lg-sq booth"></span>摊位（可预订）</div>
          <div class="lg-item"><span class="lg-sq aisle"></span>过道</div>
          <div class="lg-item"><span class="lg-sq building"></span>建筑</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLayoutTemplate, createLayoutTemplate, updateLayoutTemplate } from '../../api'

const route = useRoute()
const router = useRouter()

// ===== 画布规格 =====
const CELL = 56
const COLS = 18
const ROWS = 13
const SQUARE = 54 // 方块尺寸（格内留 2px 间隙）

const typeMeta = {
  booth: { label: '摊位', color: '#f97316' },
  aisle: { label: '过道', color: '#e5e7eb' },
  building: { label: '建筑', color: '#6b7280' }
}
const typeKeys = Object.keys(typeMeta)
const palette = ['#f97316', '#e5e7eb', '#6b7280', '#16a34a', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6']

const templateId = ref(null)
const marketName = ref('')
const squares = ref([])
const selectedId = ref(null)
const saving = ref(false)

// ===== 默认预置布局（60 摊位 + 25 过道 + 8 建筑）=====
function defaultSquares() {
  const arr = []
  let id = 1
  function add(type, r0, c0, rows, cols) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({ id: id++, type, name: '', x: (c0 + c) * CELL, y: (r0 + r) * CELL, color: null })
      }
    }
  }
  // 左上摊位区 5×6
  add('booth', 1, 1, 5, 6)
  // 右上建筑（2×2）
  add('building', 1, 8, 2, 2)
  // 中部横向过道
  add('aisle', 6, 1, 1, 13)
  // 右下摊位区 5×6
  add('booth', 7, 1, 5, 6)
  // 左下建筑（2×2）
  add('building', 7, 8, 2, 2)
  // 竖向过道（两摊位区之间）
  add('aisle', 1, 7, 12, 1)
  // 摊位编号 A01…
  let n = 1
  arr.forEach((s) => {
    if (s.type === 'booth') s.name = 'A' + String(n++).padStart(2, '0')
  })
  return arr
}

// ===== 渲染 =====
const sqColor = (sq) => sq.color || typeMeta[sq.type].color

const sqStyle = (sq) => ({
  left: sq.x + 'px',
  top: sq.y + 'px',
  width: SQUARE + 'px',
  height: SQUARE + 'px',
  background: sqColor(sq)
})

const selectedSq = computed(() => squares.value.find((s) => s.id === selectedId.value) || null)

// ===== 编号 =====
function nextBoothName() {
  let max = 0
  squares.value.forEach((s) => {
    const m = /^A(\d+)$/.exec(s.name || '')
    if (m) max = Math.max(max, parseInt(m[1], 10))
  })
  return 'A' + String(max + 1).padStart(2, '0')
}

function nextId() {
  let m = 0
  squares.value.forEach((s) => { if (s.id > m) m = s.id })
  return m + 1
}

// ===== 选中 =====
function selectSq(id) {
  selectedId.value = id
}

// ===== 拖拽移动 =====
let drag = null
function onSqMouseDown(ev, sq) {
  selectSq(sq.id)
  ev.preventDefault()
  const startX = ev.clientX
  const startY = ev.clientY
  drag = { sq, startX, startY, origX: sq.x, origY: sq.y, moved: false }
}

function onMouseMove(ev) {
  if (!drag) return
  const dx = ev.clientX - drag.startX
  const dy = ev.clientY - drag.startY
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
  const nx = Math.max(0, Math.min((COLS - 1) * CELL, snap(drag.origX + dx)))
  const ny = Math.max(0, Math.min((ROWS - 1) * CELL, snap(drag.origY + dy)))
  drag.sq.x = nx
  drag.sq.y = ny
}

function onMouseUp() {
  drag = null
}

function snap(v) {
  return Math.round(v / CELL) * CELL
}

// ===== 增加 / 删除方块 =====
function findEmptyCell() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL
      const y = r * CELL
      const taken = squares.value.some((s) => s.x === x && s.y === y)
      if (!taken) return { x, y }
    }
  }
  return null
}

function addSquare() {
  const cell = findEmptyCell()
  if (!cell) {
    ElMessage.warning('画布已满，请先删除一些方块')
    return
  }
  const sq = { id: nextId(), type: 'booth', name: nextBoothName(), x: cell.x, y: cell.y, color: null }
  squares.value.push(sq)
  selectSq(sq.id)
  ElMessage.success(`已增加方块 #${sq.id}（${sq.name}）`)
}

function removeSquare() {
  const sq = selectedSq.value
  if (!sq) {
    ElMessage.warning('请先点击选中要删除的方块')
    return
  }
  squares.value = squares.value.filter((s) => s.id !== sq.id)
  selectedId.value = null
  ElMessage.success(`已删除方块 #${sq.id}`)
}

// ===== 类型切换 / 名称 =====
function changeType(t) {
  const sq = selectedSq.value
  if (!sq) return
  sq.type = t
  if (sq.type === 'booth' && !sq.name) sq.name = nextBoothName()
}

function onNameChange() {
  const sq = selectedSq.value
  if (!sq) return
  sq.name = (sq.name || '').trim()
}

// ===== 恢复默认 =====
function resetDefault() {
  squares.value = defaultSquares()
  selectedId.value = null
  ElMessage.success('已恢复默认布局')
}

// ===== 保存 =====
async function saveLayout() {
  saving.value = true
  try {
    const payload = {
      name: marketName.value.trim() || '请输入市集名称',
      canvasWidth: 1008,
      canvasHeight: 728,
      gridSize: CELL,
      background: '',
      elements: JSON.stringify(squares.value)
    }
    if (templateId.value) {
      await updateLayoutTemplate(templateId.value, payload)
    } else {
      const res = await createLayoutTemplate(payload)
      templateId.value = res.data
    }
    ElMessage.success('已成功保存')
    router.push('/admin/layout-templates')
  } catch (e) {
    const isNetwork = !e.response || e.code === 'ECONNABORTED' || /network|timeout|网络/i.test(e.message || '')
    ElMessage.error(isNetwork ? '网络中断，请稍后保存' : '保存失败，请重新保存')
  } finally {
    saving.value = false
  }
}

// ===== 旧版格式 → 方块格式（兼容历史模板数据）=====
function migrateElements(elements) {
  try {
    const arr = JSON.parse(elements || '[]')
    if (!Array.isArray(arr) || arr.length === 0) return defaultSquares()
    // 已经是新版 squares 格式
    if (arr.some((e) => ['booth', 'aisle', 'building'].includes(e.type))) {
      return arr.map((e) => ({
        id: e.id ?? nextId(),
        type: e.type,
        name: e.name || '',
        x: e.x ?? 0,
        y: e.y ?? 0,
        color: e.color || null
      }))
    }
    // 旧版 stall/zone → 换算到 1008×728 网格
    const oldW = 210
    const oldH = 297
    const res = []
    let id = 1
    arr.forEach((e) => {
      const x = Math.round((e.x / oldW) * (COLS * CELL) / CELL) * CELL
      const y = Math.round((e.y / oldH) * (ROWS * CELL) / CELL) * CELL
      const w = e.width ? Math.max(1, Math.round((e.width / oldW) * COLS)) * CELL : CELL
      const h = e.height ? Math.max(1, Math.round((e.height / oldH) * ROWS)) * CELL : CELL
      if (e.type === 'stall') {
        res.push({ id: id++, type: 'booth', name: e.stallNo || nextBoothName(), x, y, color: e.color || null })
      } else {
        // zone 区域按宽度拆成多个过道方块
        const cols = Math.min(COLS, Math.round(w / CELL))
        const rows = Math.min(ROWS, Math.round(h / CELL))
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            res.push({ id: id++, type: 'aisle', name: r === 0 && c === 0 ? (e.name || '') : '', x: x + c * CELL, y: y + r * CELL, color: null })
          }
        }
      }
    })
    return res
  } catch (e) {
    return defaultSquares()
  }
}

// ===== 初始化 =====
onMounted(async () => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  const id = route.query.id
  if (id) {
    templateId.value = Number(id)
    try {
      const res = await getLayoutTemplate(id)
      const t = res.data
      marketName.value = t.name || ''
      squares.value = migrateElements(t.elements)
    } catch (e) {
      ElMessage.error('模板加载失败')
      squares.value = defaultSquares()
    }
  } else {
    marketName.value = ''
    squares.value = defaultSquares()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.editor { display: flex; flex-direction: column; height: calc(100vh - 120px); background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.topbar {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb; flex-wrap: wrap;
}
.name-field { display: flex; align-items: center; gap: 8px; }
.name-field .label { font-size: 13px; color: #374151; font-weight: 500; }
.spacer { flex: 1; }

.editor-body { display: flex; flex: 1; min-height: 0; }

.canvas-panel {
  flex: 1; min-width: 0; overflow: hidden;
  display: flex; flex-direction: column;
  background: #f3f4f6; padding: 16px;
}
.canvas-scroll { flex: 1; overflow: auto; border-radius: 8px; background: #f8fafc; border: 1px solid #e5e7eb; }
.canvas {
  position: relative;
  width: 1008px; height: 728px;
  background-color: #fffdf8;
  background-image:
    linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px);
  background-size: 56px 56px;
  border: 1px solid #eadfce;
  border-radius: 8px;
  margin: 12px;
}
.sq {
  position: absolute;
  width: 54px; height: 54px;
  border: 1px solid rgba(0,0,0,0.28);
  border-radius: 6px;
  cursor: grab;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: #fff;
  user-select: none;
  transition: box-shadow 0.12s ease;
  box-sizing: border-box;
}
.sq:hover { box-shadow: 0 0 0 2px rgba(0,0,0,0.15); z-index: 2; }
.sq:active { cursor: grabbing; }
.sq.booth { background: #f97316; }
.sq.aisle { background: #e5e7eb; color: #9ca3af; border-style: dashed; }
.sq.building { background: #6b7280; }
.sq.selected { outline: 3px solid #16a34a; outline-offset: 2px; z-index: 3; box-shadow: 0 2px 10px rgba(22,163,74,0.4); }
.canvas-hint { margin-top: 10px; font-size: 11px; color: #9ca3af; line-height: 1.8; }

.side {
  width: 270px; flex-shrink: 0; overflow-y: auto;
  border-left: 1px solid #e5e7eb; padding: 18px 16px; background: #fff;
}
.side h2 {
  font-size: 15px; color: #1f2937; font-weight: 600;
  margin: 0 0 12px;
}
.side h2:not(:first-child) { margin-top: 22px; padding-top: 16px; border-top: 1px dashed #e5e7eb; }
.prop-empty {
  font-size: 12px; color: #9ca3af; line-height: 1.8;
  background: #fafafa; border: 1px dashed #e5e7eb; border-radius: 10px;
  padding: 14px 12px;
}
.prop-row { margin-bottom: 14px; }
.prop-row > label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 7px; }
.type-btns { display: flex; gap: 8px; }
.type-btn {
  flex: 1; padding: 9px 0; border: 2px solid #e5e7eb; border-radius: 9px;
  background: #fff; font-size: 13px; font-weight: 600; font-family: inherit;
  color: #374151; cursor: pointer; transition: all 0.12s ease;
}
.type-btn.active { border-color: #f97316; background: #fff3e6; color: #c2570a; }
.type-btn .dot {
  display: inline-block; width: 10px; height: 10px; border-radius: 3px;
  margin-right: 5px; vertical-align: -1px;
}
.palette { display: flex; flex-wrap: wrap; gap: 8px; }
.palette .sw {
  width: 30px; height: 30px; border-radius: 7px; cursor: pointer;
  border: 2px solid transparent; transition: transform 0.1s ease;
}
.palette .sw:hover { transform: scale(1.12); }
.palette .sw.active { border-color: #1f2937; }
.pos-info { font-size: 11px; color: #9ca3af; margin-top: 10px; }

.legend { display: flex; flex-direction: column; gap: 8px; }
.legend .lg-item { display: flex; align-items: center; gap: 9px; font-size: 12px; color: #4b5563; }
.legend .lg-sq {
  width: 18px; height: 18px; border-radius: 5px; border: 1px solid rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.lg-sq.booth { background: #f97316; }
.lg-sq.aisle { background: #e5e7eb; }
.lg-sq.building { background: #6b7280; }
</style>
