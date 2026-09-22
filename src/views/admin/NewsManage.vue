<template>
  <div class="panel">
    <div class="panel-head">
      <h3>新闻中心 · 活动发布</h3>
      <el-button type="primary" @click="openCreate">发布活动</el-button>
    </div>
    <el-table :data="list" stripe>
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column label="分类" width="110">
        <template #default="{ row }">{{ categoryName(row.categoryId) }}</template>
      </el-table-column>
      <el-table-column label="重要" width="70">
        <template #default="{ row }">
          <el-tag v-if="row.isImportant === 1" type="danger" size="small">重要</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'" size="small">
            {{ row.status === 'PUBLISHED' ? '已发布' : '已下线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="activityTime" label="活动时间" width="170" />
      <el-table-column label="操作" width="230">
        <template #default="{ row }">
          <el-button size="small" link @click="openEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 'PUBLISHED'" size="small" type="warning" link @click="offline(row)">下线</el-button>
          <el-button v-else size="small" type="success" link @click="online(row)">上架</el-button>
          <el-button v-if="row.status === 'OFFLINE'" size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '发布活动'" width="640px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="活动标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="文章分类">
          <el-select v-model="form.categoryId" clearable style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="活动详情">
          <el-input v-model="form.content" type="textarea" :rows="4" />
        </el-form-item>


        <!-- <el-form-item label="活动时间">
          <el-input v-model="form.activityTime" placeholder="如：2026-10-15 至 2026-10-20" />
        </el-form-item> -->


        <!-- 活动时间（日期范围选择） -->
<el-form-item label="活动时间">
  <el-date-picker
    v-model="activityTimeRange"
    type="daterange"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    value-format="YYYY-MM-DD"
    @change="onActivityTimeChange"
    style="width:100%"
  />
</el-form-item>



        <el-form-item label="活动地点">
          <el-input v-model="form.activityLocation" />
        </el-form-item>

<!-- 
        <el-form-item label="报名截止">
          <el-input v-model="form.registerDeadline" placeholder="如：2026-10-01" />
        </el-form-item> -->


        <!-- 报名截止：不能晚于活动开始日期 -->
<el-form-item label="报名截止">
  <el-date-picker
    v-model="form.registerDeadline"
    type="date"
    placeholder="选择报名截止日期"
    value-format="YYYY-MM-DD"
    :disabled-date="disabledRegisterDeadline"
    style="width:100%"
  />
</el-form-item>

        <el-form-item label="封面图">
          <el-upload
            :show-file-list="false"
            :http-request="()=>{}"
            :before-upload="beforeCoverUpload"
            accept="image/*"
          >
            <el-button>上传封面</el-button>
          </el-upload>
          <el-image v-if="form.coverUrl" :src="form.coverUrl" style="width: 240px; margin-top: 8px" fit="cover" />
        </el-form-item>
        <el-form-item label="重要通知">
          <el-switch v-model="form.isImportant" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 封面裁剪弹窗 比例16:9 -->
    <el-dialog
      v-model="coverCropDialog"
      title="裁剪封面(16:9)"
      width="720px"
      class="cover-crop-dialog"
      @opened="onCropDialogOpened"
      @close="onCropDialogClose"
    >
      <div class="crop-wrap">
        <VueCropper
          ref="coverCropperRef"
          :img="coverCropImg"
          :aspect-ratio="16 / 9"
          :auto-crop="true"
          :auto-crop-width="800"
          :auto-crop-height="450"
          :fixed="true"
          :fixed-number="[16,9]"
          can-move
          can-move-zoom
          can-rotate
        />
      </div>
      <template #footer>
        <el-button @click="coverCropDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCoverCrop">确定裁剪上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getNewsList, createNews, updateNews, offlineNews, onlineNews, deleteNews, getCategories, uploadImage } from '../../api'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const list = ref([])
const categories = ref([])
const dialogVisible = ref(false)
const saving = ref(false)

//封面裁剪
const coverCropperRef = ref(null)
const coverCropDialog = ref(false)
const coverCropImg = ref('')
let tempCoverObjectUrl = ''
// 新增：用于日期范围选择器临时存储 [start,end]
const activityTimeRange = ref([])
/**
 * 活动时间范围变更，拼接为后端需要的 "2026‑10‑01 至 2026‑10‑20"
 */
const onActivityTimeChange = (val) => {
  if(!val || val.length !==2){
    form.activityTime = ''
    return
  }
  const [start,end] = val
  form.activityTime = `${start} 至 ${end}`
}

/**
 * 报名截止禁用逻辑：大于活动开始时间的日期不可选
 */
const disabledRegisterDeadline = (time) => {
  if(!activityTimeRange.value || activityTimeRange.value.length ===0) return false
  const activityStart = new Date(activityTimeRange.value[0])
  return time.getTime() > activityStart.getTime()
}







const beforeCoverUpload = (file) => {
  tempCoverObjectUrl = URL.createObjectURL(file)
  coverCropDialog.value = true
  return false
}

//弹窗完全打开，赋值图片，不再这里 revoke
const onCropDialogOpened = () => {
  coverCropImg.value = tempCoverObjectUrl
}

//关闭弹窗：清空图片、释放内存
const onCropDialogClose = () => {
  coverCropImg.value = ''
  if(tempCoverObjectUrl){
    URL.revokeObjectURL(tempCoverObjectUrl)
    tempCoverObjectUrl = ''
  }
}


const confirmCoverCrop = () => {
  coverCropperRef.value?.cropper?.getCropBlob(async (blob) => {
    if (!blob) return
    const fd = new FormData()
    fd.append('file', blob)
    const res = await uploadImage(fd)
    form.coverUrl = res.data.url
    coverCropDialog.value = false
    ElMessage.success('封面裁剪上传完成')
  })
}

const form = reactive({
  id: null, title: '', categoryId: null, summary: '', content: '',
  coverUrl: '', isImportant: 0, activityTime: '', activityLocation: '', registerDeadline: ''
})

const categoryName = (id) => categories.value.find((c) => c.id === id)?.name || '未分类'

const load = async () => {
  const [n, c] = await Promise.all([getNewsList(), getCategories()])
  list.value = n.data
  categories.value = c.data
}

const openCreate = () => {
  Object.assign(form, { id: null, title: '', categoryId: null, summary: '', content: '', coverUrl: '', isImportant: 0, activityTime: '', activityLocation: '', registerDeadline: '' })
  activityTimeRange.value = [] // 新增清空
  dialogVisible.value = true
}
const openEdit = (row) => {
  Object.assign(form, row)
  // 把 "2026‑10‑01 至 2026‑10‑20" 拆分回数组给daterange
  if(form.activityTime){
    const arr = form.activityTime.split(' 至 ')
    if(arr.length ===2){
      activityTimeRange.value = [arr[0], arr[1]]
    }else{
      activityTimeRange.value = []
    }
  }else{
    activityTimeRange.value = []
  }
  dialogVisible.value = true
}

const save = async () => {

  if (!form.title.trim()) {
    ElMessage.warning('活动标题不能为空')
    return
  }

  // 兜底校验
  if(activityTimeRange.value?.[0] && form.registerDeadline){
    const start = new Date(activityTimeRange.value[0])
    const deadline = new Date(form.registerDeadline)
    if(deadline > start){
      ElMessage.warning('报名截止不能晚于活动开始时间')
      return
    }
  }

  saving.value = true
  try {
    if (form.id) {
      await updateNews(form.id, form)
      ElMessage.success('保存成功，已同步至商户端')
    } else {
      await createNews(form)
      ElMessage.success('发布成功')
    }
    dialogVisible.value = false
    load()
  } catch (e) { /* 已由拦截器提示 */ } finally {
    saving.value = false
  }
}

const offline = async (row) => {
  await offlineNews(row.id)
  ElMessage.success('已下线')
  load()
}
const online = async (row) => {
  await onlineNews(row.id)
  ElMessage.success('已上架')
  load()
}
const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除活动「${row.title}」？删除后不可恢复。`, '提示', { type: 'warning' })
  await deleteNews(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.panel-head h3 {
  font-size: 16px;
  color: #1f2937;
}

.crop-wrap {
  height: 400px;
  width: 100%;
  background-color: #222;
}
.crop-wrap :deep(.vue-cropper){
  width:100%;
  height:100%;
}
.crop-buttons{
  margin-top:12px;
  display:flex;
  gap:8px;
  justify-content:center;
}
</style>
