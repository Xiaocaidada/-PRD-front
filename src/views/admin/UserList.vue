<template>
  <div class="panel">
    <div class="filter-bar">
      <el-input v-model="filters.name" placeholder="按姓名模糊搜索" clearable style="width: 200px" @keyup.enter="load(1)" />
      <el-input v-model="filters.licenseNo" placeholder="按证件号精确搜索" clearable style="width: 220px" @keyup.enter="load(1)" />
      <el-select v-model="filters.status" placeholder="审核状态(暂不可用)" clearable style="width: 200px">
        <el-option label="待审核" value="PENDING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已驳回" value="REJECTED" />
      </el-select>
      <el-button type="primary" @click="load(1)">查询</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="name" label="商户名称" width="120" />
      <el-table-column prop="name" label="联系人姓名" width="120" />
      <el-table-column prop="licenseNo" label="证件号" width="190" />
      <el-table-column label="审核状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.id)" size="small">{{ statusText(row.id) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="170" />
      <el-table-column label="操作" min-width="150">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="$router.push(`/admin/users/${row.id}`)">查看详情</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">删除用户(暂不可用)</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination layout="total, prev, pager, next" :total="total" :page-size="pageSize"
                     :current-page="page" @current-change="load" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUsers,get_all_status } from '../../api'
import { ElMessageBox,ElMessage } from 'element-plus'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const statusOptions=ref({})
const filters = reactive({ name: '', licenseNo: '', status: '' })



// 删除处理函数
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户【】吗？删除后不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 调用后端删除接口，把row.id传给后端
    // await delUser(row.id)
    ElMessage.success('删除成功')
    await load(page.value) // 删除后刷新当前页
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}



const statusText = (s) => {
  if ( !statusOptions.value) return "待审核"
  const status=statusOptions.value[s]
  console.log(status)
  if (status.every( item => item === "APPROVED")) return "审核通过"
  return "审核不通过"
}
const statusType = (s) => {
  if ( !statusOptions.value) return "PENDING"
  const status=statusOptions.value[s]
  if (status.every( item => item === "APPROVED")) return "success"
  return "danger"
}




const load = async (p) => {
  page.value = p || 1
  const params = { page: page.value, size: pageSize }
  if (filters.name) params.name = filters.name
  if (filters.licenseNo) params.licenseNo = filters.licenseNo
  if (filters.status) params.status = filters.status
  const res = await getUsers(params)
  console.log("users",res.data)
  const status_res=await get_all_status()
  statusOptions.value=status_res.data
  console.log(res.data)
  console.log(status_res)
  list.value = res.data.records
  total.value = Number(res.data.total)
}

onMounted(() => load(1))
</script>

<style scoped>
.panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}
.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.pager { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
