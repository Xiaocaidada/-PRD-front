<template>
  <div class="material-page">
    <el-alert type="info" :closable="false" class="tip"
              title="每个模块最多添加 5 条材料条目；单条条目最多上传5个附件；附件支持 PDF/JPG/JPEG/PNG/DOC/DOCX，单个文件不超过 10MB" />
    <div v-for="m in modules" :key="m.key" class="module-card">
      <div class="module-header">
        <h3>{{ m.name }}</h3>
        <el-button size="small" :disabled="rows(m.key).length >= 5" @click="addRow(m.key)">
          添加条目（{{ rows(m.key).length }}/5）
        </el-button>
      </div>
      <div v-for="(row, idx) in rows(m.key)" :key="row.uid" class="submit-row">
        <div class="row-main">
          <el-input v-model="row.content" type="textarea" :rows="2" maxlength="500" show-word-limit
                    placeholder="请输入文字描述" />
          <div class="row-actions">
            <!-- 上传附件：限制最多5个 -->
            <el-upload :auto-upload="false" :show-file-list="false"
                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" :on-change="(f) => pickFile(row, f)">
              <el-button size="small" :disabled="row.fileList.length >= 5">
                选择附件({{row.fileList.length}}/5)
              </el-button>
            </el-upload>
            <!-- ========= 新增：删除本条条目按钮 ========= -->
            <el-button size="small" text danger icon="Delete" 
                       :disabled="rows(m.key).length <= 1"
                       @click="handleDeleteRow(m.key, idx)">
              删除本条
            </el-button>
          </div>
          <!-- ✅ 多文件列表渲染，每个文件独立预览、独立删除 -->
          <div class="file-list-wrap" v-if="row.fileList.length > 0">
            <div class="file-item" v-for="(fileItem, fIdx) in row.fileList" :key="fIdx">
              <span class="file-name">
                <el-icon><Document /></el-icon> {{ fileItem.fileName }}
              </span>
              <el-button size="small" text @click="previewFile(fileItem)">
                <el-icon><ZoomIn /></el-icon>预览
              </el-button>
              <el-button size="small" danger text @click="removeSingleFile(row, fIdx)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!rows(m.key).length" class="empty-row">暂无条目，点击「添加条目」添加材料</div>
    </div>
    <!-- 图片预览弹窗 -->
    <el-image-viewer
      v-if="imageViewer.show"
      :url-list="[imageViewer.url]"
      @close="imageViewer.show = false"
    />
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, ZoomIn, Delete } from '@element-plus/icons-vue'
// ========= 移除旧接口 import { getMyMaterials, submitMaterial } from '../../api' =========
import { upload } from '../../api/index.js'
const modules = [
  { key: 'SOURCE', name: '商品货源' },
  { key: 'CULTURE', name: '文创内容' },
  { key: 'STANDARD', name: '生产标准' },
  { key: 'STALL', name: '文创市集摊位' }
]
const rowsByModule = reactive({ SOURCE: [], CULTURE: [], STANDARD: [], STALL: [] })
let uidSeed = 1
// 图片预览弹窗状态
const imageViewer = reactive({
  show: false,
  url: ''
})
const rows = (key) => rowsByModule[key]
const addRow = (key) => {
  rowsByModule[key].push({
    uid: uidSeed++,
    content: '',
    fileList: [],
  })
}

// ========= 新增：删除整条条目函数 =========
const handleDeleteRow = async (moduleKey, index) => {
  await ElMessageBox.confirm(
    '确定删除本条条目？本条内填写的文字描述和所有附件都将被清除。',
    '提示',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' ,appendTo: '.el-dialog__body'}
  )
  const row = rowsByModule[moduleKey][index]
  // 释放本条所有文件blob，防止内存泄漏
  row.fileList.forEach(file => {
    if (file.previewUrl) URL.revokeObjectURL(file.previewUrl)
  })
  rowsByModule[moduleKey].splice(index, 1)
  ElMessage.success('已删除本条条目')
}

const pickFile = async (row, file) => {
  if(row.fileList.length >=5){
    ElMessage.warning('本条条目最多上传5个附件！')
    return
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(ext)) {
    ElMessage.error(`不支持该文件格式：${ext}`)
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('单个文件大小不能超过 10MB')
    return
  }
  // 👉 选中文件，调用上传接口，拿到后端url
  try {
    // 构建上传用FormData
    const fd = new FormData()
    fd.append('file', file.raw)
    const res = await upload(fd)
    // ========== 修改这里 ==========
    // 后端data直接是url字符串，不是对象！
    const fileUrl = res.data
    console.log("文件上传成功url:", fileUrl)

    // 补充预览blob地址（你原来previewUrl没赋值，这里补上）
    const previewUrl = URL.createObjectURL(file.raw)

    row.fileList.push({
      raw: file.raw,
      fileName: file.name,
      previewUrl,
      url: fileUrl,
    })
    ElMessage.success(`${file.name}上传成功`)
  }catch(err){
    console.error('上传异常：',err)
    ElMessage.error(`${file.name}上传失败`)
  }
}



// 删除【单个】附件，释放blob
const removeSingleFile = (row, fileIndex) => {
  const target = row.fileList[fileIndex]
  if(target.previewUrl){
    URL.revokeObjectURL(target.previewUrl)
  }
  row.fileList.splice(fileIndex,1)
  ElMessage.info('已移除该附件')
}
// 文件预览逻辑，传入单个文件对象
const previewFile = (fileItem) => {
  const ext = (fileItem.fileName.split('.').pop() || '').toLowerCase()
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    imageViewer.url = fileItem.previewUrl
    imageViewer.show = true
  } else if (ext === 'pdf') {
    window.open(fileItem.previewUrl, '_blank')
  } else {
    ElMessage.info('Word文档无法在线预览，可下载后查看')
    window.open(fileItem.previewUrl, '_blank')
  }
}
// ========= 移除旧的submit提交函数、状态相关代码 =========
// 对外暴露：获取所有材料数据，给父组件提交竞标使用
const getMaterialData = () => {
  const result = []
  for(const m of modules) {
    const list = rowsByModule[m.key]
    for(const row of list) {
      result.push({
        module: m.key,
        content: row.content?.trim(),
        // ✅ 这里只收集后端返回的url数组
        urls: row.fileList.map(f => f.url)
      })
    }
  }
  return result
}
// 清空材料（竞标提交成功后调用）
const clearAll = () => {
  for(const key in rowsByModule) {
    // 释放blob
    rowsByModule[key].forEach(row=>{
      row.fileList.forEach(f=>{
        if(f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      })
    })
    rowsByModule[key] = []
  }
}
// 重置，打开弹窗时默认空条目
const reset = ()=>{
  clearAll()
  modules.forEach(m => addRow(m.key))
}
defineExpose({ getMaterialData, reset, clearAll })
</script>
<style scoped>
.material-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tip { margin-bottom: 4px; }
.module-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 14px;
}
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom:10px;
}
.module-header h3 { font-size: 15px; color: #1f2937; }
.submit-row {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f3f4f6;
}
.row-main { flex: 1; }
.row-actions { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
/* 多文件列表样式 */
.file-list-wrap {
  margin-top:8px;
  display:flex;
  flex-direction:column;
  gap:4px;
}
.file-item {
  display:flex;
  align-items:center;
  gap:8px;
}
.file-name {
  display: inline-flex;
  align-items: center;
  gap:4px;
  font-size:13px;
  color:#6b7280;
}
.empty-row { padding:14px; text-align:center; color:#9ca3af; font-size:13px; }
</style>
