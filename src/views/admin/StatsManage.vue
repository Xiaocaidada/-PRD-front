<template>
  <div class="stats-page">
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="stat-box"><div class="stat-num">{{ stats.orderCount || 0 }}</div><div class="stat-label">订单总数</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-box"><div class="stat-num">¥{{ fmt(stats.totalAmount) }}</div><div class="stat-label">成交金额</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-box"><div class="stat-num">¥{{ fmt(stats.refundAmount) }}</div><div class="stat-label">退款金额</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-box"><div class="stat-num">{{ stats.totalVisitors || 0 }}</div><div class="stat-label">总客流</div></div>
      </el-col>
    </el-row>

    <div class="chart-card">
      <div class="chart-head">
        <h3>各活动维度客流</h3>
        <el-button size="small" type="primary" plain @click="exportCsv">导出订单 CSV</el-button>
      </div>
      <div class="chart" ref="chartRef"></div>
      <div v-if="!hasActivityTraffic" class="empty">暂无客流数据</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getAdminStats } from '../../api'

const stats = ref({})
const chartRef = ref(null)

const fmt = (v) => (v == null ? '0.00' : Number(v).toFixed(2))
const hasActivityTraffic = computed(() => Object.keys(stats.value.activityTraffic || {}).length > 0)

const exportCsv = () => {
  window.open('/api/admin/stats/orders.csv', '_blank')
}

const drawChart = async () => {
  await nextTick()
  if (!chartRef.value || !hasActivityTraffic.value) return
  const map = stats.value.activityTraffic
  const labels = Object.keys(map).map((k) => `活动#${k}`)
  const values = Object.values(map)
  const echarts = (await import('echarts')).default
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 48, right: 24, top: 24, bottom: 32 },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] },
      barWidth: 40
    }]
  })
}

onMounted(async () => {
  const res = await getAdminStats()
  stats.value = res.data
  drawChart()
})
</script>

<style scoped>
.stats-page { display: flex; flex-direction: column; gap: 16px; }
.stat-box { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; text-align: center; }
.stat-num { font-size: 26px; font-weight: 700; color: #2563eb; }
.stat-label { font-size: 13px; color: #9ca3af; margin-top: 8px; }
.chart-card { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; }
.chart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.chart-head h3 { font-size: 16px; color: #1f2937; }
.chart { height: 320px; }
.empty { text-align: center; color: #9ca3af; padding: 40px 0; }
</style>
