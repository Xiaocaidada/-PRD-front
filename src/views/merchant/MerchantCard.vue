<template>
  <div v-if="card" class="info-card">
    <!-- ① 基本信息 -->
    <section class="card-section">
      <div class="card-header">
        <span class="card-title">商家基本信息</span>
        <span class="card-no">本地文创市集摊位管理系统编号：{{ maskNo(card.merchant.id) }}</span>
      </div>
      <div class="card-body basic">
        <div class="photo-box">
          <el-image v-if="card.merchant.licensePhoto" :src="card.merchant.licensePhoto" class="license-photo" fit="cover" />
          <div v-else class="photo-placeholder">
            <el-icon :size="36"><Picture /></el-icon>
            <span>营业执照照片<br />（待上传）</span>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="label">姓名</span><span>{{ card.merchant.name }}</span></div>
          <div class="info-item"><span class="label">性别</span><span>{{ card.merchant.gender || '—' }}</span></div>
          <div class="info-item"><span class="label">出生年月</span><span>{{ card.merchant.birthDate || '—' }}</span></div>
          <div class="info-item"><span class="label">籍贯</span><span>{{ card.merchant.birthPlace || '—' }}</span></div>
          <div class="info-item wide">
            <span class="label">证件号</span>
            <span class="mask">
              {{ showLicense ? card.merchant.licenseNo : maskNo(card.merchant.licenseNo) }}
              <el-icon class="eye" @click="showLicense = !showLicense">
                <View v-if="!showLicense" /><Hide v-else />
              </el-icon>
            </span>
          </div>
          <div class="info-item wide"><span class="label">入库时间</span><span>{{ (card.merchant.createdAt || '').slice(0, 10) }}</span></div>
        </div>
      </div>
    </section>

    <!-- ② 商品品类 -->
    <section class="card-section">
      <div class="card-body category">
        <div class="side-title">申请经营品类</div>
        <div class="category-right">
          <div class="tags">
            <el-tag v-for="c in categoryList" :key="c" type="primary" effect="light" size="large">{{ c }}</el-tag>
            <span v-if="!categoryList.length" class="empty-text">未选择</span>
          </div>
          <div class="law-tip">相关法规：经营商品须符合国家相关法律法规要求，食品类需具备相应资质。</div>
        </div>
      </div>
    </section>

    <!-- ③ 竞标书 -->
    <section class="card-section">
      <div class="card-body bid">
        <div class="bid-left">
          <div v-for="m in bidModules" :key="m.key" class="bid-module">
            <div class="module-name">{{ m.name }}</div>
            <template v-if="approvedMaterials[m.key]?.length">
              <div v-for="item in approvedMaterials[m.key]" :key="item.id" class="module-content">
                {{ item.content }}
              </div>
            </template>
            <div v-else class="module-empty">材料审核中，审核通过后展示</div>
          </div>
          <div class="bid-goods">
            <div class="module-name">商品与价格</div>
            <div v-if="card.merchant.goodsInfo || card.merchant.priceInfo" class="module-content">
              <p v-if="card.merchant.goodsInfo">商品：{{ card.merchant.goodsInfo }}</p>
              <p v-if="card.merchant.priceInfo">价格：{{ card.merchant.priceInfo }}</p>
            </div>
            <div v-else class="module-empty">材料审核中，审核通过后展示</div>
          </div>
        </div>
        <div class="bid-right">
          <div class="module-name">文创市集摊位简图</div>
          <div class="mini-map">
            <div v-for="s in stalls" :key="s.id" class="mini-stall"
                 :class="{gray: s.status === 'OCCUPIED' && card.merchant.assignedStallId !== s.id, green: s.status === 'OCCUPIED' && card.merchant.assignedStallId === s.id }"
                 :title="`${s.stallNo} ${s.name}`">
              {{ s.stallNo }}
            </div>
          </div>
          <div class="map-legend">
            <span><i class="dot green"></i>我的摊位</span>
            <span><i class="dot gray"></i>已占用</span>
            <span><i class="dot white"></i>可用</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ④ 底部说明 -->
    <section class="card-footer">
      <p>天津科技大学软件工程项目简介：本项目为本地文创市集摊位管理系统课程设计作品，用于教学演示。</p>
      <ul>
        <li>信息动态更新，请以管理后台发布内容为准</li>
        <li>本信息卡限本人使用，请勿外借</li>
        <li>查询网址：http://localhost:5173</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCard, getStallMap } from '../../api'

const card = ref(null)
const stalls = ref([])
const showLicense = ref(false)

const bidModules = [
  { key: 'SOURCE', name: '商品货源' },
  { key: 'CULTURE', name: '文创内容' },
  { key: 'STANDARD', name: '生产标准' }
]

const categoryList = computed(() =>
  card.value ? (card.value.merchant.categories || '').split(',').filter(Boolean) : []
)
const approvedMaterials = computed(() => card.value ? card.value.approvedMaterials : {})

const maskNo = (no) => {
  no=String(no)
  if (!no) return '—'
  if (no.length <= 6) return '****'
  return no.slice(0, 3) + '****' + no.slice(-3)
}

onMounted(async () => {
  const cardRes=await getCard()
  const stallRes=await getStallMap()
  console.log(cardRes)
  console.log(stallRes)
  card.value = cardRes.data
  stalls.value = stallRes.data
})
</script>

<style scoped>
.info-card { display: flex; flex-direction: column; gap: 16px; }
.card-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}
.card-title { font-size: 16px; font-weight: 700; color: #1f2937; }
.card-no { font-size: 12px; color: #6b7280; }
.card-body { padding: 20px; }
.basic { display: flex; gap: 24px; }
.photo-box {
  width: 180px;
  height: 120px;
  flex-shrink: 0;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}
.license-photo { width: 100%; height: 100%; }
.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}
.info-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
}
.info-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #1f2937;
}
.info-item .label { color: #9ca3af; width: 64px; flex-shrink: 0; }
.info-item.wide { grid-column: span 2; }
.mask { display: inline-flex; align-items: center; gap: 6px; font-family: Consolas, monospace; }
.eye { cursor: pointer; color: #9ca3af; }
.eye:hover { color: #2563eb; }

.category { display: flex; gap: 24px; }
.side-title { width: 96px; color: #1f2937; font-weight: 600; }
.category-right { flex: 1; display: flex; flex-direction: column; gap: 10px; }
.tags { display: flex; flex-wrap: wrap; gap: 10px; }
.law-tip { font-size: 12px; color: #9ca3af; }

.bid { display: flex; gap: 24px; }
.bid-left { flex: 3; display: flex; flex-direction: column; gap: 14px; }
.bid-right { flex: 2; display: flex; flex-direction: column; gap: 12px; }
.bid-module { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.module-name { font-size: 14px; font-weight: 600; color: #4b5563; margin-bottom: 6px; }
.module-content { font-size: 14px; color: #374151; line-height: 1.7; }
.module-content p { margin-bottom: 4px; }
.module-empty { font-size: 13px; color: #9ca3af; }
.mini-map {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}
.mini-stall {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #d1d5db;
  color: #6b7280;
}
.mini-stall.green { background: #dcfce7; border-color: #22c55e; color: #15803d; font-weight: 600; }
.mini-stall.gray { background: #f3f4f6; border-color: #e5e7eb; color: #d1d5db; }
.map-legend { display: flex; gap: 16px; font-size: 12px; color: #6b7280; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 4px; }
.dot.green { background: #22c55e; }
.dot.gray { background: #e5e7eb; }
.dot.white { background: #fff; border: 1px solid #d1d5db; }

.card-footer {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 16px 20px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.9;
}
.card-footer ul { margin-left: 18px; }
.empty-text { color: #9ca3af; font-size: 13px; }

@media (max-width: 768px) {
  .basic, .category, .bid { flex-direction: column; }
  .bid-left, .bid-right { flex: 1; }
}
</style>
