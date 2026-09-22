<template>
  <div class="panel">
    <div class="panel-head">
      <h3>动态导航管理（最多两级）</h3>
      <el-button type="primary" @click="openCreate(0)">新增一级栏目</el-button>
    </div>
    <el-alert type="info" :closable="false" class="tip"
              title="一级栏目名限 10 字符；删除父级栏目将同步删除其子级栏目" />

    <el-table :data="list" stripe>
      <el-table-column label="栏目名称" min-width="180">
        <template #default="{ row }">
          <span :style="{ fontWeight: row.parentId === 0 ? 700 : 400 }">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="层级" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.parentId === 0 ? 'primary' : 'info'">
            {{ row.parentId === 0 ? '一级' : '二级' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="url" label="跳转地址" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button v-if="row.parentId === 0" size="small" link @click="openCreate(row.id)">加子级</el-button>
          <el-button size="small" link @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑栏目' : (form.parentId === 0 ? '新增一级栏目' : '新增二级栏目')" width="420px">
      <el-form label-width="90px">
        <el-form-item label="栏目名称">
          <el-input v-model="form.name" maxlength="10" show-word-limit />
        </el-form-item>
        <el-form-item label="排序序号">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="跳转地址">
          <el-input v-model="form.url" placeholder="如 /guide/register" />
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
import { getNavs, createNav, updateNav, deleteNav } from '../../api'

const list = ref([])
const dialogVisible = ref(false)
const form = reactive({ id: null, parentId: 0, name: '', sort: 0, url: '' })

const load = async () => {
  const res = await getNavs()
  list.value = res.data
}

const openCreate = (parentId) => {
  Object.assign(form, { id: null, parentId, name: '', sort: 0, url: '' })
  dialogVisible.value = true
}

const openEdit = (row) => {
  Object.assign(form, row)
  dialogVisible.value = true
}

const save = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('栏目名称不能为空')
    return
  }
  if (form.id) {
    await updateNav(form.id, { name: form.name.trim(), sort: form.sort, url: form.url })
  } else {
    await createNav({ parentId: form.parentId, name: form.name.trim(), sort: form.sort, url: form.url })
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  load()
}

const remove = async (row) => {
  const tip = row.parentId === 0 ? '该栏目为一级栏目，删除将同步删除其子级栏目。' : ''
  await ElMessageBox.confirm(`确认删除栏目「${row.name}」？${tip}`, '提示', { type: 'warning' })
  await deleteNav(row.id)
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
</style>
