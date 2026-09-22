<template>
  <div class="stall-page">
    <div class="stall-card">
      <div class="stall-header">
        <div>
          <h3>文创市集摊位竞标</h3>
          <p class="sub">同级别摊位可多选；被选择的摊位将以红色标注</p>
        </div>
        <el-button type="primary" :loading="saving" @click="save">保存竞标</el-button>
      </div>

      <!-- 平面图 -->
      <div class="map">
        <div v-for="s in stalls" :key="s.id" class="stall"
             :class="{ selected: selected.includes(s.id), occupied: s.status === 'OCCUPIED' }"
             :style="posStyle(s)" @click="toggle(s)">
          <div class="stall-no">{{ s.stallNo }}</div>
          <div class="stall-name">{{ s.name }}</div>
        </div>
      </div>

      <div class="legend">
        <span><i class="dot red"></i>已选择</span>
        <span><i class="dot white"></i>可选</span>
        <span><i class="dot gray"></i>已占用</span>
        <span class="tip-right">同一摊位仅可分配给一个商户</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStallMap, saveBids } from '../../api'

const stalls = ref([])
const selected = ref([])
const saving = ref(false)

const posStyle = (s) => ({
  gridColumn: s.gridX,
  gridRow: s.gridY
})

const toggle = (s) => {
  if (s.status === 'OCCUPIED') {
    ElMessage.warning('该摊位已被占用，不可竞标')
    return
  }
  const idx = selected.value.indexOf(s.id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(s.id)
}

const save = async () => {
  saving.value = true
  try {
    await saveBids(selected.value)
    ElMessage.success('竞标已保存')
  } catch (e) { /* 已由拦截器提示 */ } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const res = await getStallMap()
  stalls.value = res.data
  selected.value = res.data.filter((s) => s.myBid).map((s) => s.id)
})
</script>

<style scoped>
.stall-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
}
.stall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.stall-header h3 { font-size: 18px; color: #1f2937; }
.sub { font-size: 13px; color: #9ca3af; margin-top: 4px; }
.map {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: 90px;
  gap: 12px;
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  min-height: 320px;
}
.stall {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #fff;
  border: 2px solid #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.stall:hover { border-color: #2563eb; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
.stall.selected { background: #fee2e2; border-color: #ef4444; }
.stall.occupied { background: #f3f4f6; border-color: #e5e7eb; color: #d1d5db; cursor: not-allowed; }
.stall-no { font-size: 16px; font-weight: 700; color: #1f2937; }
.stall.occupied .stall-no { color: #c0c4cc; }
.stall-name { font-size: 12px; color: #6b7280; }
.legend { display: flex; align-items: center; gap: 18px; margin-top: 16px; font-size: 13px; color: #6b7280; }
.dot { display: inline-block; width: 12px; height: 12px; border-radius: 4px; margin-right: 4px; vertical-align: -1px; }
.dot.red { background: #ef4444; }
.dot.white { background: #fff; border: 1px solid #d1d5db; }
.dot.gray { background: #f3f4f6; border: 1px solid #e5e7eb; }
.tip-right { margin-left: auto; color: #9ca3af; font-size: 12px; }
</style>
