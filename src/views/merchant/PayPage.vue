<template>
  <div class="pay-page">
    <div class="pay-card">
      <div class="merchant-info">
        <el-avatar :size="56" class="avatar">{{ (merchant.name || '商')[0] }}</el-avatar>
        <div>
          <div class="merchant-name">{{ merchant.name }}</div>
          <div class="stall-no">摊位：{{ merchant.stallNo || '—' }}</div>
        </div>
      </div>

      <div class="amount-box">
        <span class="currency">¥</span>
        <el-input v-model="amount" class="amount-input" placeholder="0.00" maxlength="8" />
      </div>

      <el-button type="primary" class="qr-btn" :disabled="!amount" @click="genQr">生成收款二维码</el-button>

      <div v-if="qrData" class="qr-box">
        <img :src="qrData" alt="收款二维码" />
        <p>请使用支付 App 扫码付款</p>
      </div>

      <div class="tips">
        <p>本页面为课程演示收款页，不产生真实支付。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { getPublicMerchant } from '../../api'

const route = useRoute()
const merchant = ref({})
const amount = ref('')
const qrData = ref('')

const genQr = async () => {
  const payText = `booth://pay?merchant=${route.params.id}&amount=${amount.value}&name=${encodeURIComponent(merchant.value.name)}`
  qrData.value = await QRCode.toDataURL(payText, { width: 220, margin: 1 })
}

onMounted(async () => {
  const res = await getPublicMerchant(route.params.id)
  merchant.value = res.data
})
</script>

<style scoped>
.pay-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff, #f5f7fa);
  padding: 24px;
}
.pay-card {
  width: 400px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(37, 99, 235, 0.14);
  padding: 32px;
  text-align: center;
}
.merchant-info { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.avatar { background: #2563eb; color: #fff; font-size: 24px; }
.merchant-name { font-size: 18px; font-weight: 700; color: #1f2937; text-align: left; }
.stall-no { font-size: 13px; color: #9ca3af; text-align: left; }
.amount-box {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 8px;
  margin-bottom: 20px;
}
.currency { font-size: 28px; font-weight: 700; color: #1f2937; }
.amount-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding: 0;
  font-size: 36px;
  font-weight: 700;
  color: #1f2937;
}
.qr-btn { width: 100%; height: 44px; }
.qr-box { margin-top: 24px; }
.qr-box img { border: 8px solid #f8fafc; border-radius: 12px; }
.qr-box p { font-size: 13px; color: #6b7280; margin-top: 8px; }
.tips { margin-top: 24px; font-size: 12px; color: #c0c4cc; }
</style>
