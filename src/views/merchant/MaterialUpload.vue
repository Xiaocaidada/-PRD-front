<template>
  <div class="material-page">
    <el-alert type="info" :closable="false" class="tip"
              title="每个模块最多同时存在 5 条待审核材料；附件支持 PDF/JPG/JPEG/PNG/DOC/DOCX，单个文件不超过 10MB" />

    <div v-for="m in modules" :key="m.key" class="module-card">
      <div class="module-header">
        <h3>{{ m.name }}</h3>
        <el-button size="small" :disabled="pendingCount(m.key) >= 5" @click="addRow(m.key)">
          添加条目（{{ pendingCount(m.key) }}/5 待审核）
        </el-button>
      </div>

      <div v-for="(row, idx) in rows(m.key)" :key="row.uid" class="submit-row" :class="{ locked: row.locked }">
        <div class="row-main">
          <el-input v-model="row.content" type="textarea" :rows="2" maxlength="500" show-word-limit
                    :disabled="row.locked" placeholder="请输入文字描述（审核通过后将展示在信息卡对应模块）" />
          <div class="row-actions">
            <el-upload :auto-upload="false" :show-file-list="false" :disabled="row.locked" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                       :on-change="(f) => pickFile(row, f)">
              <el-button size="small" :disabled="row.locked">选择附件</el-button>
            </el-upload>
            <span v-if="row.fileName" class="file-name">
              <el-icon><Document /></el-icon> {{ row.fileName }}
            </span>
            <el-button v-if="!row.locked" type="primary" size="small" :loading="row.loading"
                       @click="submit(m.key, row)">提交审核</el-button>
            <el-tag v-if="row.status" :type="row.status === 'APPROVED' ? 'success' : (row.status === 'REJECTED' ? 'danger' : 'warning')" size="small">
              {{ statusText(row) }}
            </el-tag>
          </div>
          <div v-if="row.rejectReason" class="reject-reason">驳回原因：{{ row.rejectReason }}</div>
        </div>
      </div>

      <div v-if="!rows(m.key).length" class="empty-row">暂无条目，点击「添加条目」开始提交</div>
    </div>

    <!-- 历史材料 -->
    <div class="module-card">
      <div class="module-header"><h3>全部提交记录</h3></div>
      <el-table :data="history" size="small" stripe>
        <el-table-column prop="moduleText" label="模块" width="110" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column prop="fileName" label="附件" width="180">
          <template #default="{ row }">
            <el-link v-if="row.filePath" type="primary" :href="row.filePath" target="_blank">{{ row.fileName }}</el-link>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'APPROVED' ? 'success' : (row.status === 'REJECTED' ? 'danger' : 'warning')" size="small">
              {{ row.status === 'APPROVED' ? '已通过' : (row.status === 'REJECTED' ? '已驳回' : '待审核') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejectReason" label="驳回原因" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="提交时间" width="160" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyMaterials, submitMaterial } from '../../api'

const modules = [
  { key: 'SOURCE', name: '商品货源' },
  { key: 'CULTURE', name: '文创内容' },
  { key: 'STANDARD', name: '生产标准' },
  { key: 'STALL', name: '文创市集摊位' }
]

const rowsByModule = reactive({ SOURCE: [], CULTURE: [], STANDARD: [], STALL: [] })
const history = ref([])
let uidSeed = 1

const rows = (key) => rowsByModule[key]
const pendingCount = (key) => rowsByModule[key].filter((r) => r.status === 'PENDING').length

const addRow = (key) => {
  rowsByModule[key].push({ uid: uidSeed++, content: '', file: null, fileName: '', loading: false, locked: false, status: '', rejectReason: '' })
}

const pickFile = (row, file) => {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(ext)) {
    ElMessage.error(`以下文件格式不支持：${ext}`)
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }
  row.file = file.raw
  row.fileName = file.name
}

const submit = async (key, row) => {
  if (!row.content || !row.content.trim()) {
    ElMessage.warning('请填写文字描述')
    return
  }
  row.loading = true
  try {
    const fd = new FormData()
    fd.append('module', key)
    fd.append('content', row.content.trim())
    if (row.file) fd.append('file', row.file)
    await submitMaterial(fd)
    ElMessage.success('提交成功，等待审核')
    row.locked = true
    row.status = 'PENDING'
    row.file = null
    await load()
  } catch (e) { /* 已由拦截器提示 */ } finally {
    row.loading = false
  }
}

const statusText = (row) => {
  if (row.status === 'APPROVED') return '已通过'
  if (row.status === 'REJECTED') return '已驳回'
  if (row.status === 'PENDING') return '待审核'
  return ''
}

const load = async () => {
  const res = await getMyMaterials()
  const list = res.data
  history.value = list.map((m) => ({
    ...m,
    moduleText: modules.find((x) => x.key === m.module)?.name || m.module
  }))
  // 同步待审核条目状态
  modules.forEach((m) => {
    const pending = list.filter((x) => x.module === m.key && x.status === 'PENDING').length
    const locked = rowsByModule[m.key].filter((r) => r.status === 'PENDING').length
    // 后台已存在待审核则锁定前端空行
    rowsByModule[m.key].forEach((r) => {
      if (r.status === 'PENDING' && pending <= 5) r.locked = true
    })
  })
}

const refreshPending = computed(() => {
  const res = {}
  modules.forEach((m) => {
    res[m.key] = rowsByModule[m.key].filter((r) => r.status === 'PENDING').length
  })
  return res
})

onMounted(async () => {
  modules.forEach((m) => addRow(m.key))
  await load()
})
</script>

<style scoped>
.material-page { display: flex; flex-direction: column; gap: 16px; }
.tip { margin-bottom: 4px; }
.module-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.module-header h3 { font-size: 16px; color: #1f2937; }
.submit-row {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
}
.submit-row.locked { opacity: 0.75; }
.row-main { flex: 1; }
.row-actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.file-name { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #6b7280; }
.reject-reason { margin-top: 6px; font-size: 12px; color: #ef4444; }
.empty-row { padding: 20px; text-align: center; color: #9ca3af; font-size: 13px; }
</style>
