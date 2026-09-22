<template>
  <div class="panel">
    <div class="panel-head">
      <h3>Banner 管理（前端 3:1 轮播）</h3>
      <el-button type="primary" @click="openCreate">新增 Banner</el-button>
    </div>
    <el-alert type="info" :closable="false" class="tip"
              title="图片必须为 3:1 比例；支持「上架/隐藏」一键切换" />

    <el-table :data="list" stripe>
      <el-table-column label="预览" width="200">
        <template #default="{ row }">
          <img v-if="row.imageUrl" :src="row.imageUrl" class="preview" alt="" />
          <span v-else class="no-img">无图</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="140" />
      <el-table-column prop="linkUrl" label="跳转链接" min-width="140" show-overflow-tooltip />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="状态" width="100">
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑 Banner' : '新增 Banner'" width="560px">
      <el-form label-width="90px">
        <el-form-item label="3:1 图片">
          <el-upload :show-file-list="false" :http-request="uploadImg" accept="image/*">
            <el-button>上传 3:1 图片</el-button>
          </el-upload>
          <div v-if="form.imageUrl" class="img-preview-box">
            <img :src="form.imageUrl" class="img-preview" alt="" />
          </div>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="如 /news/1" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBanners, createBanner, updateBanner, deleteBanner, uploadImage } from '../../api'

const list = ref([])
const dialogVisible = ref(false)
const form = reactive({ id: null, title: '', imageUrl: '', linkUrl: '', sort: 0, status: 'ON' })

const load = async () => {
  const res = await getBanners()
  list.value = res.data
}

const openCreate = () => {
  Object.assign(form, { id: null, title: '', imageUrl: '', linkUrl: '', sort: 0, status: 'ON' })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const uploadImg = async ({ file }) => {
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImage(fd)
  form.imageUrl = res.data.url
  ElMessage.success('上传成功，请确认图片比例为 3:1')
}

const save = async () => {
  if (!form.imageUrl) {
    ElMessage.warning('请上传 3:1 图片')
    return
  }
  if (form.id) {
    await updateBanner(form.id, form)
  } else {
    await createBanner(form)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

const toggleStatus = async (row, v) => {
  await updateBanner(row.id, { status: v ? 'ON' : 'HIDDEN' })
  ElMessage.success('已更新')
  load()
}

const remove = async (row) => {
  await ElMessageBox.confirm('确认删除该 Banner？', '提示', { type: 'warning' })
  await deleteBanner(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.panel { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-head h3 { font-size: 16px; color: #1f2937; }
.tip { margin-bottom: 16px; }
.preview { width: 180px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
.no-img { color: #9ca3af; font-size: 13px; }
.img-preview-box { margin-top: 8px; }
.img-preview { width: 360px; border-radius: 8px; border: 1px solid #e5e7eb; }
</style>
