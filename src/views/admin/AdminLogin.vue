<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h2>管理后台登录</h2>
        <p>本地文创市集摊位管理系统 · 管理员</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" size="large">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入管理员用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" @keyup.enter="submit" />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="submit">登 录</el-button>
      </el-form>
      <div class="auth-footer">
        默认账号 admin / admin123
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin } from '../../api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: '', password: '' })

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await adminLogin(form)
    localStorage.setItem('admin_booth_token', res.data.token)
    localStorage.setItem('admin_booth_role', 'ADMIN')
    localStorage.setItem('admin_booth_name', res.data.adminName)
    ElMessage.success('登录成功')
    router.push('/admin/users')
  } catch (e) { /* 已由拦截器提示 */ } finally {
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
  background: linear-gradient(135deg, #1e3a5f 0%, #1f2937 100%);
}
.auth-card {
  width: 420px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: 40px 36px;
}
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-header h2 { font-size: 22px; color: #1f2937; margin-bottom: 6px; }
.auth-header p { font-size: 13px; color: #9ca3af; }
.submit-btn { width: 100%; margin-top: 8px; }
.auth-footer { margin-top: 18px; text-align: center; font-size: 13px; color: #9ca3af; }
</style>
