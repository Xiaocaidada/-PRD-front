<template>
  <div class="stats-page">
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="stat-box">
          <div class="stat-num">{{ stats.orderCount || 0 }}</div>
          <div class="stat-label">订单数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-box">
          <div class="stat-num">¥{{ fmt(stats.totalAmount) }}</div>
          <div class="stat-label">成交金额</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-box">
          <div class="stat-num">¥{{ fmt(stats.netAmount) }}</div>
          <div class="stat-label">实收金额</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-box">
          <div class="stat-num">{{ stats.totalVisitors || 0 }}</div>
          <div class="stat-label">累计客流</div>
        </div>
      </el-col>
    </el-row>

    <div class="chart-card">
      <h3>近 7 天摊位客流趋势</h3>
      <div class="chart" ref="chartRef"></div>
    </div>

    <div class="pay-card">
      <div class="pay-info">
        <h3>付款链接</h3>
        <p>生成付款链接供顾客在线支付使用（演示环境生成收款页）</p>
        <div v-if="payLink" class="pay-link-box">
          <span class="link-text">{{ payLink.payUrl }}</span>
          <el-button type="primary" size="small" @click="copyLink">复制链接</el-button>
          <el-button size="small" @click="$router.push(`/pay/${payLink.merchantId}`)">打开收款页</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getMerchantStats, getPayLink } from '../../api'

const stats = ref({})
const payLink = ref(null)
const chartRef = ref(null)

const fmt = (v) => (v == null ? '0.00' : Number(v).toFixed(2))

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(`http://localhost:5173${payLink.value.payUrl}`)
    ElMessage.success('链接已复制')
  } catch (e) {
    ElMessage.warning('复制失败，请手动复制')
  }
}

const drawChart = async () => {
  await nextTick()
  if (!chartRef.value) return
  const trend = stats.value.trafficTrend || {}
  const dates = Object.keys(trend).sort()
  const values = dates.map((d) => trend[d])

  // 动态引入 ECharts 以减小初始包体
  const echarts = (await import('echarts')).default
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 24, bottom: 32 },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      data: values,
      areaStyle: { color: 'rgba(37, 99, 235, 0.12)' },
      lineStyle: { color: '#2563eb', width: 3 },
      itemStyle: { color: '#2563eb' }
    }]
  })
}

onMounted(async () => {
  const [statsRes, linkRes] = await Promise.all([getMerchantStats(), getPayLink()])
  stats.value = statsRes.data
  payLink.value = linkRes.data
  drawChart()
})
</script>

<style scoped>
.stats-page { display: flex; flex-direction: column; gap: 16px; }
.stat-box {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  text-align: center;
}
.stat-num { font-size: 28px; font-weight: 700; color: #2563eb; }
.stat-label { font-size: 13px; color: #9ca3af; margin-top: 8px; }
.chart-card, .pay-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 24px;
}
.chart-card h3, .pay-card h3 { font-size: 16px; color: #1f2937; margin-bottom: 14px; }
.chart { height: 300px; }
.pay-info p { font-size: 13px; color: #9ca3af; margin-bottom: 14px; }
.pay-link-box { display: flex; align-items: center; gap: 12px; }
.link-text { font-family: Consolas, monospace; font-size: 14px; color: #2563eb; background: #eff6ff; padding: 8px 12px; border-radius: 6px; }
</style>
