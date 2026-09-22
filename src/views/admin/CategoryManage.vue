<template>
  <div class="panel">
    <div class="panel-head">
      <h3>文章分类管理</h3>
      <el-button type="primary" @click="openCreate">新增分类</el-button>
    </div>
    <el-alert type="info" :closable="false" class="tip"
              title="勾选「固定展示」的分类将作为 Tab 显示在首页新闻中心；删除分类不影响已有文章（文章归属置空）" />

    <el-table :data="list" stripe>
      <el-table-column prop="name" label="分类名称" />
      <el-table-column label="固定展示" width="120">
        <template #default="{ row }">
          <el-switch :model-value="row.fixedOnHome === 1" :disabled="!row.id"
                     @change="(v) => toggleFixed(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="分类页 URL" min-width="220">
        <template #default="{ row }">
          <span v-if="row.url" class="url-text">{{ row.url }}</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" link @click="openEdit(row)">重命名</el-button>
          <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '重命名分类' : '新增分类'" width="400px">
      <el-form label-width="90px">
        <el-form-item label="分类名称">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="固定展示">
          <el-switch v-model="form.fixedOnHome" :active-value="1" :inactive-value="0" />
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
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api'

const list = ref([])
const dialogVisible = ref(false)
const form = reactive({ id: null, name: '', fixedOnHome: 0 })

const load = async () => {
  const res = await getCategories()
  list.value = res.data
}

const openCreate = () => {
  Object.assign(form, { id: null, name: '', fixedOnHome: 0 })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, { id: row.id, name: row.name, fixedOnHome: row.fixedOnHome })
  dialogVisible.value = true
}

const toggleFixed = async (row, v) => {
  await updateCategory(row.id, { fixedOnHome: v ? 1 : 0 })
  ElMessage.success('已更新')
  load()
}

const save = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  if (form.id) {
    await updateCategory(form.id, { name: form.name.trim(), fixedOnHome: form.fixedOnHome })
  } else {
    await createCategory({ name: form.name.trim(), fixedOnHome: form.fixedOnHome })
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除分类「${row.name}」？已有文章归属将置空。`, '提示', { type: 'warning' })
  await deleteCategory(row.id)
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
.url-text { font-family: Consolas, monospace; color: #2563eb; font-size: 13px; }
</style>
