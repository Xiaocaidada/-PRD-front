<template>
  <div class="panel">
    <div class="panel-head">
      <h3>文化合作单位管理</h3>
      <el-button type="primary" @click="openCreate">新增单位</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="name" label="单位名称" min-width="180" />
      <el-table-column label="所属分类" width="150">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="序号" width="80" />
      <el-table-column prop="linkUrl" label="跳转链接" min-width="140" show-overflow-tooltip />
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

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑单位' : '新增单位'" width="460px">
      <el-form label-width="90px">
        <el-form-item label="单位名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="所属分类" required>
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="学术指导单位" value="学术指导单位" />
            <el-option label="学校科普单位" value="学校科普单位" />
            <el-option label="产学研单位" value="产学研单位" />
          </el-select>
        </el-form-item>
        <el-form-item label="展示序号">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="选填，留空则不可点击" />
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
import { getPartners, createPartner, updatePartner, deletePartner } from '../../api'

const list = ref([])
const dialogVisible = ref(false)
const form = reactive({ id: null, name: '', category: '', sort: 0, linkUrl: '', status: 'ON' })

const load = async () => {
  const res = await getPartners()
  list.value = res.data
}

const openCreate = () => {
  Object.assign(form, { id: null, name: '', category: '', sort: 0, linkUrl: '', status: 'ON' })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const save = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('单位名称不能为空')
    return
  }
  if (!form.category) {
    ElMessage.warning('所属分类不能为空')
    return
  }
  if (form.id) {
    await updatePartner(form.id, form)
  } else {
    await createPartner(form)
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

const toggleStatus = async (row, v) => {
  await updatePartner(row.id, { status: v ? 'ON' : 'OFF' })
  ElMessage.success('已更新')
  load()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', { type: 'warning' })
  await deletePartner(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<style scoped>
.panel { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-head h3 { font-size: 16px; color: #1f2937; }
</style>
