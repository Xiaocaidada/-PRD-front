<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2>商户登录</h2>
        <p>本地文创市集摊位管理系统</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" size="large">
        <el-form-item label="证件号 / 手机号" prop="account">
          <el-input v-model="form.account" placeholder="请输入营业执照号码或手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item label="图形验证码" prop="captchaCode">
          <div class="captcha-row">
            <el-input v-model="form.captchaCode" placeholder="4 位验证码" maxlength="4" @keyup.enter="submit" />
            <img :src="captchaSrc" class="captcha-img" title="点击刷新" @click="refreshCaptcha" />
          </div>
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="submit">登 录</el-button>
      </el-form>
      <div class="auth-footer">
        还没有账号？<el-link type="primary" @click="$router.push('/register')">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaptcha, login } from '../../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const captchaSrc = ref('')
const form = reactive({ account: '', password: '', captchaId: '', captchaCode: '' })

const rules = {
  account: [{ required: true, message: '请输入证件号或手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }]
}

const refreshCaptcha = async () => {
  const res = await getCaptcha()
  form.captchaId = res.data.captchaId
  captchaSrc.value = `data:image/png;base64,${res.data.imageBase64}`
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await login(form)
    localStorage.setItem('booth_token', res.data.token)
    localStorage.setItem('booth_role', 'MERCHANT')
    localStorage.setItem('booth_name', res.data.name)
    ElMessage.success('登录成功')
    router.push('/merchant/card')
  } catch (e) {
    refreshCaptcha()
    form.captchaCode = ''
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f5f7fa 60%, #e0e7ff 100%);
}
.auth-card {
  width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(37, 99, 235, 0.12);
  padding: 40px 36px;
}
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-header h2 { font-size: 22px; color: #1f2937; margin-bottom: 6px; }
.auth-header p { font-size: 13px; color: #9ca3af; }
.captcha-row { display: flex; gap: 12px; width: 100%; }
.captcha-img {
  width: 120px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}
.submit-btn { width: 100%; margin-top: 8px; }
.auth-footer { margin-top: 18px; text-align: center; font-size: 14px; color: #6b7280; }
</style>
