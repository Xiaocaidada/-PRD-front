<template>
  <div v-if="detail" class="detail-page">
    <el-page-header @back="$router.push('/admin/users')" content="用户详情与材料审核" class="page-head" />

    <!-- 基本信息 + 审核操作 -->
    <div class="panel">
      <div class="panel-head">
        <h3>商户基本信息</h3>

      </div>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="姓名">{{ detail.merchant.name }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail.merchant.gender || '—' }}</el-descriptions-item>
        <el-descriptions-item label="出生年月">{{ detail.merchant.birthDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="籍贯">{{ detail.merchant.birthPlace || '—' }}</el-descriptions-item>
        <el-descriptions-item label="证件号">{{ detail.merchant.licenseNo }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail.merchant.phone }}</el-descriptions-item>
        <el-descriptions-item label="商品品类">{{ detail.merchant.categories || '—' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detail.merchant.email || '—' }}</el-descriptions-item>
        <el-descriptions-item label="商品信息">{{ detail.merchant.goodsInfo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="价格信息">{{ detail.merchant.priceInfo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detail.merchant.createdAt }}</el-descriptions-item>

<el-descriptions-item label="营业执照" :span="3">
  <div v-if="detail.merchant.licensePhoto" style="display:flex;align-items:center;">
    <el-image
      :src="detail.merchant.licensePhoto"
      style="width:160px;max-height:120px;"
      fit="contain"
      :preview-src-list="[detail.merchant.licensePhoto]"
    />
  </div>
  <span v-else style="color:#999">无营业执照</span>
</el-descriptions-item>




        <el-descriptions-item label="分配摊位">
          {{ detail.assignedStall ? detail.assignedStall.stallNo + ' ' + detail.assignedStall.name : '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.merchant.rejectReason" label="驳回原因" :span="2">
          <span class="danger">{{ detail.merchant.rejectReason }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="hasAnyDiff" style="margin-top: 24px;">
      <div class="panel-head">
        <h3>商户请求修改数据如下：</h3>

      </div>

      <el-descriptions :column="3" border>
<el-descriptions-item v-if="has_edit.name&&has_edit.name!==detail.merchant.name">
  <template #label>
    <span style="color:red">新</span>*姓名
  </template>
  {{ has_edit.name}}
</el-descriptions-item>

<el-descriptions-item v-if="has_edit.priceInfo&&has_edit.priceInfo!==detail.merchant.priceInfo">
  <template #label>
    <span style="color:red">新</span>*价格信息
  </template>
  {{ has_edit.priceInfo}}
</el-descriptions-item>

<el-descriptions-item v-if="has_edit.goodsInfo&&has_edit.goodsInfo!==detail.merchant.goodsInfo">
  <template #label>
    <span style="color:red">新</span>*价格信息
  </template>
  {{ has_edit.goodsInfo}}
</el-descriptions-item>



<el-descriptions-item v-if="has_edit.gender&&has_edit.gender!==detail.merchant.gender">
  <template #label>
    <span style="color:red">新</span>*性别
  </template>
  {{ has_edit.gender}}
</el-descriptions-item>
<el-descriptions-item v-if="has_edit.birthDate&&has_edit.birthDate!==detail.merchant.birthDate">
  <template #label>
    <span style="color:red">新</span>*出生年月
  </template>
  {{ has_edit.birthDate}}
</el-descriptions-item>
<el-descriptions-item v-if="has_edit.birthPlace&&has_edit.birthPlace!==detail.merchant.birthPlace">
  <template #label>
    <span style="color:red">新</span>*籍贯
  </template>
  {{ has_edit.birthPlace}}
</el-descriptions-item>
<el-descriptions-item v-if="has_edit.licenseNo&&has_edit.licenseNo!==detail.merchant.licenseNo">
  <template #label>
    <span style="color:red">新</span>*证件号
  </template>
  {{ has_edit.licenseNo }}
</el-descriptions-item>
<el-descriptions-item v-if="has_edit.phone&&has_edit.phone!==detail.merchant.phone">
  <template #label>
    <span style="color:red">新</span>*手机号
  </template>
  {{ has_edit.phone }}
</el-descriptions-item>
<el-descriptions-item v-if="has_edit.categories&&has_edit.categories!==detail.merchant.categories">
  <template #label>
    <span style="color:red">新</span>*商品品类
  </template>
  {{ has_edit.categories}}
</el-descriptions-item>
<el-descriptions-item v-if="has_edit.email&&has_edit.email!==detail.merchant.email">
  <template #label>
    <span style="color:red">新</span>*邮箱
  </template>
  {{ has_edit.email }}
</el-descriptions-item>

<!-- 新增：营业执照图片修改 -->
<el-descriptions-item v-if="has_edit.licensePhoto && has_edit.licensePhoto !== detail.merchant.licensePhoto" :span="3">
  <template #label>
    <span style="color:red">新</span>*营业执照
  </template>
  <div style="display:flex;align-items:center;">
    <el-image
      :src="has_edit.licensePhoto"
      style="width:160px;max-height:120px;"
      fit="contain"
      :preview-src-list="[has_edit.licensePhoto]"
    />
  </div>
</el-descriptions-item>




<!-- 更改时间保留原样不动 -->
<el-descriptions-item label="更改时间">{{ has_edit.createdAt }}</el-descriptions-item>

      </el-descriptions>
          <div class="ops panel-head" style="margin-top: 12px;" >
          <!-- <el-tag :type="statusType(detail.merchant.status)" size="small" >{{ statusText(detail.merchant.status) }}</el-tag> -->
          <el-button   type="danger" size="small" @click="rejectVisible = true">驳回</el-button>
          <el-button   type="success" size="small" @click="doApprove">审核通过</el-button>
        </div>
      </div>
    </div>

    <!-- 补充材料 -->
    <div class="panel">
      <h3>补充材料（{{ moduleText }}）</h3>
      <el-table :data="detail.materials" stripe size="small">
        <el-table-column label="模块" width="110">
          <template #default="{ row }">{{ moduleName(row.module) }}</template>
        </el-table-column>
        <el-table-column prop="content" label="文本描述" min-width="240" />
        <el-table-column label="附件" width="180">
          <template #default="{ row }">
            <el-link v-if="row.filePath" type="primary" :href="row.filePath" target="_blank">{{ row.fileName || '预览' }}</el-link>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'APPROVED' ? 'success' : (row.status === 'REJECTED' ? 'danger' : 'warning')" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button size="small" type="success" link @click="review(row, true)">通过</el-button>
              <el-button size="small" type="danger" link @click="openReject(row)">驳回</el-button>
            </template>

            <el-button v-else-if="row.status==='APPROVED'"  size="small" type="danger" link @click="openReject(row)">驳回</el-button>
            <el-button v-else="row.status==='REJECTED'"  size="small" type="success" link @click="review(row,true)">通过</el-button>

            <!-- <span v-else class="passed">已通过</span> -->
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 竞标摊位 -->
    <div class="panel">
      <h3>竞标摊位（{{ detail.bids.length }} 个）</h3>
      <el-tag v-for="id in detail.bids" :key="id" class="bid-tag">{{ stallNo(id) }}</el-tag>
      <el-tag v-if="!detail.bids.length" type="info">未提交竞标</el-tag>
    </div>

    <!-- 驳回用户 -->
    <el-dialog v-model="rejectVisible" title="驳回用户" width="420px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因（必填）" />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 驳回材料 -->
    <el-dialog v-model="materialRejectVisible" title="驳回材料" width="420px">
      <el-input v-model="materialRejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因（必填，商户端可见）" />
      <template #footer>
        <el-button @click="materialRejectVisible = false">取消</el-button>
        <el-button type="danger" @click="doRejectMaterial">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserDetail, approveUser, rejectUser, reviewMaterial, editCard, uploadImage, getAdminStallMap,get_merchant_edit } from '../../api'

const route = useRoute()
const detail = ref(null)
const stalls = ref([])
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectTarget = ref(null)
const materialRejectVisible = ref(false)
const materialRejectReason = ref('')
const savingCard = ref(false)
const has_edit=ref(null)

const editForm = reactive({ gender: '', birthDate: '', birthPlace: '', goodsInfo: '', priceInfo: '', licensePhoto: '' })

const moduleText = computed(() => detail.value?.materials.length ? '' : '暂无提交')
const moduleName = (m) => ({ SOURCE: '商品货源', CULTURE: '文创内容', STANDARD: '生产标准', STALL: '文创市集摊位' }[m] || m)
const statusText = (s) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回' }[s] || s)
const statusType = (s) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[s] || 'info')
const stallNo = (id) => stalls.value.find((s) => s.id === id)?.stallNo || `#${id}`







const load = async () => {
  const [d, s,h] = await Promise.all([getUserDetail(route.params.id), getAdminStallMap(),get_merchant_edit(route.params.id)])
  detail.value = d.data
  stalls.value = s.data
  has_edit.value=h.data
  console.log(detail.value)
  console.log(has_edit.value)
  Object.assign(editForm, {
    gender: d.data.merchant.gender || '',
    birthDate: d.data.merchant.birthDate || '',
    birthPlace: d.data.merchant.birthPlace || '',
    goodsInfo: d.data.merchant.goodsInfo || '',
    priceInfo: d.data.merchant.priceInfo || '',
    licensePhoto: d.data.merchant.licensePhoto || ''
  })
}


const hasAnyDiff = computed(()=>{
  if(!has_edit.value || !detail.value) return false
  const m = detail.value.merchant
  const e = has_edit.value
  const diffArr = [
    e.name && e.name !== m.name,
    e.priceInfo && e.priceInfo !== m.priceInfo,
    e.goodsInfo && e.goodsInfo !== m.goodsInfo,
    e.gender && e.gender !== m.gender,
    e.birthDate && e.birthDate !== m.birthDate,
    e.birthPlace && e.birthPlace !== m.birthPlace,
    e.licenseNo && e.licenseNo !== m.licenseNo,
    e.phone && e.phone !== m.phone,
    e.categories && e.categories !== m.categories,
    e.email && e.email !== m.email,
    e.licensePhoto && e.licensePhoto !== m.licensePhoto
  ]
  return diffArr.some(Boolean)
})



const doApprove = async () => {
  await approveUser(route.params.id)
  ElMessage.success('已审核通过')
  load()
}

const doReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('驳回原因不能为空')
    return
  }
  await rejectUser(route.params.id, rejectReason.value.trim())
  ElMessage.success('已驳回')
  rejectVisible.value = false
  load()
}

const review = async (row, approve) => {
  await reviewMaterial({ materialId: row.id, approve })
  ElMessage.success('操作成功')
  load()
}

const openReject = (row) => {
  rejectTarget.value = row
  materialRejectReason.value = ''
  materialRejectVisible.value = true
}

const doRejectMaterial = async () => {
  if (!materialRejectReason.value.trim()) {
    ElMessage.warning('驳回原因不能为空')
    return
  }
  await reviewMaterial({ materialId: rejectTarget.value.id, approve: false, rejectReason: materialRejectReason.value.trim() })
  ElMessage.success('已驳回')
  materialRejectVisible.value = false
  load()
}

const uploadLicense = async ({ file }) => {
  const fd = new FormData()
  fd.append('file', file)
  const res = await uploadImage(fd)
  editForm.licensePhoto = res.data.url
}

const saveCard = async () => {
  savingCard.value = true
  try {
    await editCard(route.params.id, editForm)
    ElMessage.success('保存成功，已同步至商户端')
    load()
  } catch (e) { /* 已由拦截器提示 */ } finally {
    savingCard.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 16px; }
.page-head { margin-bottom: 4px; }
.panel { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.panel h3 { font-size: 16px; color: #1f2937; margin-bottom: 14px; }
.ops { display: flex; gap: 8px; align-items: center; }
.danger { color: #ef4444; }
.bid-tag { margin-right: 8px; }
.passed { color: #9ca3af; font-size: 13px; }
</style>
