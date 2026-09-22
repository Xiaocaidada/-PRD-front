<template>
  <div class="auth-page">
    <div class="auth-card wide">
      <div class="auth-header">
        <h2>商户注册</h2>
        <p>以营业执照证件号为唯一标识</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" size="large">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="商户负责人姓名" prop="name">
              <el-input v-model="form.name" placeholder="需与证件一致" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照号码" prop="licenseNo">
              <el-input v-model="form.licenseNo" placeholder="系统唯一标识" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品品类（可多选）" prop="categories">
          <el-checkbox-group v-model="form.categories">
            <el-checkbox v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="form.phone" placeholder="11 位手机号" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="短信验证码" prop="smsCode">
              <div class="sms-row">
                <el-input v-model="form.smsCode" placeholder="6 位数字" maxlength="6" />
                <el-button :disabled="countdown > 0" @click="sendCode">
                  {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert v-if="devCode" type="success" :closable="false" class="dev-tip"
                  :title="`【演示】短信验证码已发送：${devCode}`" />

        <el-form-item label="电子邮箱（选填）" prop="email">
          <el-input v-model="form.email" placeholder="用于接收通知" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设置密码（至少 8 位）" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="form.confirmPassword" type="password" show-password placeholder="再次输入密码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-button type="primary" class="submit-btn" :loading="loading" @click="submit">注 册</el-button>
      </el-form>
      <div class="auth-footer">
        已有账号？<el-link type="primary" @click="$router.push('/login')">直接登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendSms, register } from '../../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
const devCode = ref('')
let timer = null

const categoryOptions = ['食品', '出版物', '日用品', '服装', '酒类']

const form = reactive({
  name: '',
  categories: [],
  licenseNo: '',
  phone: '',
  smsCode: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const rules = {
  name: [{ required: true, message: '请输入商户负责人姓名', trigger: 'blur' }],
  categories: [{ required: true, type: 'array', min: 1, message: '请至少选择一项商品品类', trigger: 'change' }],
  licenseNo: [{ required: true, message: '请输入营业执照号码', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号码格式不正确', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入短信验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为 6 位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const sendCode = async () => {
  if (!/^1\d{10}$/.test(form.phone)) {
    ElMessage.warning('请先输入正确的手机号码')
    return
  }
  const res = await sendSms(form.phone)
  devCode.value = res.data.devCode
  ElMessage.success('验证码已发送')
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await register(form)
    localStorage.setItem('booth_token', res.data.token)
    localStorage.setItem('booth_role', 'MERCHANT')
    localStorage.setItem('booth_name', form.name)
    ElMessage.success('注册成功，已自动登录')
    router.push('/merchant/card')
  } catch (e) {
    /* 已由拦截器提示 */
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f5f7fa 60%, #e0e7ff 100%);
  padding: 32px 0;
}
.auth-card {
  width: 620px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(37, 99, 235, 0.12);
  padding: 40px 36px;
}
.auth-header { text-align: center; margin-bottom: 24px; }
.auth-header h2 { font-size: 22px; color: #1f2937; margin-bottom: 6px; }
.auth-header p { font-size: 13px; color: #9ca3af; }
.sms-row { display: flex; gap: 10px; width: 100%; }
.dev-tip { margin-bottom: 16px; }
.submit-btn { width: 100%; margin-top: 8px; }
.auth-footer { margin-top: 18px; text-align: center; font-size: 14px; color: #6b7280; }
</style>
