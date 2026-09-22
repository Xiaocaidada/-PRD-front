<template>
  <div class="panel">
    <div class="panel-head">
      <h3>创意创新代表人物管理</h3>
      <el-button type="primary" @click="openCreate">新增人物</el-button>
    </div>
    <el-alert type="info" :closable="false" class="tip" title="前端以 1:1 圆形展示，请上传 1:1 头像图片" />

    <el-table :data="list" stripe>
      <el-table-column label="头像" width="90">
        <template #default="{ row }">
          <el-avatar :size="48" :src="row.avatar">{{ row.name[0] }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="title" label="头衔" min-width="160" />
      <el-table-column prop="sort" label="序号" width="80" />
      <el-table-column label="展示" width="100">
        <template #default="{ row }">
          <el-switch :model-value="row.status === 'ON'" @change="(v) => toggleStatus(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" link @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑人物' : '新增人物'" width="460px">
      <el-form label-width="90px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="头衔">
          <el-input v-model="form.title" />
        </el-form-item>



        <!-- <el-form-item label="1:1 头像">
          <el-upload :show-file-list="false" :http-request="uploadAvatar" accept="image/*">
            <el-button>上传头像</el-button>
          </el-upload>
          <el-avatar v-if="form.avatar" :size="64" :src="form.avatar" style="margin-top: 8px" />
        </el-form-item> -->

<!-- 表单头像预览 -->
<el-form-item label="1:1 头像">
  <el-upload
    :show-file-list="false"
    :http-request="()=>{}"
    :before-upload="beforeAvatarUpload"
    accept="image/*"
  >
    <el-button>上传头像</el-button>
  </el-upload>

  <el-avatar
    v-if="form.avatar"
    :size="64"
    :src="form.avatar"
    style="margin-top: 8px;"
  />
</el-form-item>




        <el-form-item label="序号">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>



<el-dialog v-model="cropDialogVisible" title="裁剪头像(1:1)" width="620px" class="avatar-crop-dialog">
  <div class="crop-wrap">
<VueCropper
  ref="cropperRef"
  :img="cropImgUrl"
  :aspect-ratio="1"
  :auto-crop="true"
  :auto-crop-width="200"
  :auto-crop-height="200"
  :fixed="true"
  :fixed-number="[1, 1]"
  can-move
  can-move-zoom
  can-rotate
/>
  </div>
  <template #footer>
    <el-button @click="cropDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="confirmCrop">确定裁剪并上传</el-button>
  </template>
</el-dialog>






  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRepresentatives, createRepresentative, updateRepresentative, deleteRepresentative, uploadImage } from '../../api'
// 引入裁剪组件
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const list = ref([])
const dialogVisible = ref(false)
const form = reactive({ id: null, name: '', title: '', avatar: '', sort: 0, status: 'ON' })

//裁剪相关变量
const cropperRef = ref(null)
const cropDialogVisible = ref(false)
const cropImgUrl = ref('')
// 拦截el‑upload，不直接上传，打开裁剪弹窗
const beforeAvatarUpload = (file) => {
  console.log('选择的文件：', file)
  cropImgUrl.value = URL.createObjectURL(file)
  cropDialogVisible.value = true
  return false
}


//确认裁剪，拿到blob，调用上传接口
const confirmCrop = () => {
  cropperRef.value.getCropBlob(async (blob) => {
    if(!blob) return
    const fd = new FormData()
    fd.append('file', blob)
    const res = await uploadImage(fd)
    form.avatar = res.data.url
    cropDialogVisible.value = false
    ElMessage.success('头像裁剪上传完成')
  })
}






const load = async () => {
  const res = await getRepresentatives()
  list.value = res.data
}

const openCreate = () => {
  Object.assign(form, { id: null, name: '', title: '', avatar: '', sort: 0, status: 'ON' })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const uploadAvatar = async ({ file }) => {
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImage(fd)
  form.avatar = res.data.url
}

const save = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('姓名不能为空')
    return
  }
  if (form.id) {
    await updateRepresentative(form.id, form)
  } else {
    await createRepresentative(form)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

const toggleStatus = async (row, v) => {
  await updateRepresentative(row.id, { status: v ? 'ON' : 'OFF' })
  ElMessage.success('已更新')
  load()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', { type: 'warning' })
  await deleteRepresentative(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.crop-wrap {
  height: 420px;
  width: 100%;
  background: #333;
}

.crop-wrap :deep(.vue-cropper) {
  height: 100%;
  width: 100%;
}

.crop-buttons {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.avatar-preview {
  margin-top: 8px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-crop-dialog :deep(.vue-cropper__box) {
  border-radius: 50%;
  overflow: hidden;
}

.avatar-crop-dialog :deep(.vue-cropper__selection) {
  border-radius: 50%;
}

.avatar-crop-dialog :deep(.vue-cropper__selection-grid) {
  display: none;
}
.panel { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-head h3 { font-size: 16px; color: #1f2937; }
.tip { margin-bottom: 16px; }
</style>
