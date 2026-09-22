import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('booth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 401) {
      localStorage.removeItem('booth_token')
      localStorage.removeItem('booth_role')
      ElMessage.error(res.message || '请重新登录')
      router.push('/login')
      return Promise.reject(new Error(res.message))
    }
    if (res.code !== 0) {
      ElMessage.error(res.message || '操作失败')
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    ElMessage.error(error.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)



const admin_request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

admin_request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_booth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


admin_request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 401) {
      localStorage.removeItem('admin_booth_token')
      localStorage.removeItem('admin_booth_role')
      ElMessage.error(res.message || '请重新登录')
      router.push('/login')
      return Promise.reject(new Error(res.message))
    }
    if (res.code !== 0) {
      ElMessage.error(res.message || '操作失败')
      return Promise.reject(new Error(res.message))
    }
    return res
  },
  (error) => {
    ElMessage.error(error.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)



export {request ,admin_request}
