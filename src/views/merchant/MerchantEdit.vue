<template>
<div class="modify-apply-edit">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">商户信息修改申请</span>
        </div>
      </template>

      <div class="readonly-info-block">
        <div class="label-title">当前已有信息</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <span class="label">姓名:</span>
              <span class="value">{{ copy.name || "未知" }}</span>
            </div>
          </el-col>

            <el-col :span="8">
            <div class="info-item">
              <span class="label">电子邮件:</span>
              <span class="value">{{ copy.email || "无" }}</span>
            </div>
          </el-col>


          
          <el-col :span="8">
            <div class="info-item">
              <span class="label">性别:</span>
              <span class="value">{{ copy.gender || "未知" }}</span>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="info-item">
              <span class="label">出生日期:</span>
              <span class="value">{{ copy.birthDate || "无" }}</span>
            </div>
          </el-col>


          <el-col :span="8">
            <div class="info-item">
              <span class="label">手机号:</span>
              <span class="value">{{ copy.phone || "无" }}</span>
            </div>
          </el-col>


            <el-col :span="8">
            <div class="info-item">
              <span class="label">营业执照号码:</span>
              <span class="value">{{ copy.licenseNo || "无" }}</span>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="info-item">
              <span class="label">商品品类:</span>
              <span class="value">{{ copy.categories || "无" }}</span>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="info-item">
              <span class="label">商品信息:</span>
              <span class="value">{{ copy.goodsInfo || "暂无" }}</span>
            </div>
          </el-col>

          


          <el-col :span="8">
            <div class="info-item">
              <span class="label">价格信息:</span>
              <span class="value">{{ copy.priceInfo || "无" }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <span class="label">籍贯:</span>
              <span class="value">{{ copy.birthPlace || '—' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-divider content-position="left">填写修改内容（提交后等待管理员审核）</el-divider>

      <el-form :model="profile"  ref="formRef" :rules="rules" label-width="100px">
        <el-row :gutter="20">

          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="profile.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="profile.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>

          


          <el-col :span="5">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="profile.gender " placeholder="请选择">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>


          <el-col :span="12">
          <el-form-item label="出生日期:" prop="birthDate">
            <!-- 年月日选择器 + readonly禁止手动输入 -->
            <el-date-picker
              v-model="profile.birthDate"
              type="date"
              placeholder="选择出生年月日"
              value-format="YYYY-MM-DD"
              style="width:100%"
            />
          </el-form-item>
          </el-col>



          <el-col :span="12">
            <el-form-item label="籍贯" prop="birthPlace">
              <el-input v-model="profile.birthPlace" placeholder="" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="营业执照号码" prop="licenseNo">
              <el-input v-model="profile.licenseNo" placeholder="请输入营业执照号码" />
            </el-form-item>
          </el-col>


          <el-col :span="12">
            <el-form-item label="商品信息" prop="goodsInfo">
              <el-input v-model="profile.goodsInfo" placeholder="如：手作糕点、文创布袋" />
            </el-form-item>
          </el-col>


            <el-col :span="12">
          <el-form-item label="商品品类（可多选）" prop="categories">
            <el-checkbox-group v-model="profile.categories">
              <el-checkbox label="食品" value="食品" />
              <el-checkbox label="出版物" value="出版物" />
              <el-checkbox label="日用品" value="日用品" />
              <el-checkbox label="服装" value="服装" />
              <el-checkbox label="酒类" value="酒类" />
            </el-checkbox-group>
          </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="价格信息" prop="priceInfo">
              <el-input v-model="profile.priceInfo" placeholder="如：糕点 20‑60元" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="电子邮件" prop="email">
              <el-input v-model="profile.email" placeholder="如：xxx@163.com" />
            </el-form-item>
          </el-col>
          
          <el-col :span="24">
            <el-form-item label="营业执照">
              <el-upload
                v-model:file-list="pict"
                list-type="picture-card"
                :auto-upload="true"
                @success="handleFileChange"
                action="http://127.0.0.1:8080/api/merchant/materials/submit"
                :headers="uploadHeaders"
              >
                <el-button type="primary">上传图片</el-button>
              </el-upload>
            </el-form-item>
          </el-col>

        </el-row>

        <el-form-item>
          <el-button type="primary" @click="submit">提交修改申请</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div> 


</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted,computed } from 'vue'
import { getProfile,merchant_editCard } from "../../api/index.js"
import {ElMessage} from 'element-plus'
const route = useRoute()
const profile=ref({name:""})
const copy=ref({name:""})
const formRef = ref(null)
const pict=ref([])



const getToken = () => localStorage.getItem('booth_token')


const uploadHeaders = computed(()=>{
  return {
    // 和后端AuthInterceptor约定好的header名称，看你拦截器取的是哪个
    Authorization: `Bearer ${getToken()}`
    // 如果你的拦截器读取header是token，就写成 token: getToken()
  }
})



const handleFileChange = (response,file) => {
  // 直接覆盖，只保留最新选的这一张，旧图片直接丢弃
  pict.value = [file]
}

/**
 * 通用校验：禁止首尾空格，只能大小写字母、下划线
 */
const validateAlphaUnderline = (rule, value, callback) => {
  if (!value)  callback()
  if (value.length<3 || value.length>20) {
    return callback(new Error('长度在 3 到 20 个字符'))
  }
  // 检测前后空格
  if(/^\s/.test(value) || /\s$/.test(value)){
    return callback(new Error('输入不允许前后空格'))
  }
  // 只能大小写字母、下划线、中文
const reg = /^[\u4e00-\u9fa5A-Za-z0-9_.]+$/
  if(!reg.test(value)){
    return callback(new Error('仅允许大小写字母、下划线、中文和数字'))
  }
  callback()
}

/**
 * 商品品类多选校验：至少选择一项
 */
const validateGoodsType = (rule, value, callback) => {
  if (!Array.isArray(value) || value.length === 0) {
    callback(new Error('请至少选择一项商品品类'))
  } else {
    callback()
  }
}

const rules = ref({
  name: [
    { required: false, validator: validateAlphaUnderline, trigger: 'blur' }
  ],
  phone: [
    { required: false, message: '', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位国内手机号', trigger: 'blur' }
  ],
  gender: [
    { required: false, message: '', trigger: 'change' }
  ],
  birthDate: [
    { required: false, message: '', trigger: 'change' }
  ],
  birthPlace: [
    { required: false, validator: validateAlphaUnderline, trigger: 'blur' }
  ],
  licenseNo: [
    { required: false, message: '', trigger: 'blur' },
    // 统一社会信用代码：18位，数字+大写字母，不含I、O、Z、S、V
    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '统一社会信用代码格式错误(18位)', trigger: 'blur' }
  ],
  categories: [
    { required: true, validator: validateGoodsType, trigger: 'change' }
  ],
  goodsInfo: [
    { required: false, validator: validateAlphaUnderline, trigger: 'blur' }
  ],
  priceInfo: [
    { required: false, validator: validateAlphaUnderline, trigger: 'blur' }
  ],
  email: [
    { required: false, message: '', trigger: 'blur' },
    { type: 'email', message: '请输入合法邮箱地址', trigger: 'blur' }
  ]
})




onMounted(async ()=>{
    const resp=await getProfile()
    profile.value=resp.data
    copy.value=JSON.parse(JSON.stringify(resp.data))
    console.log(profile.value)

    profile.value.categories=profile.value.categories.split(",")
    
    pict.value=[]
    if (resp.data.licensePhoto) {
    pict.value.push({
        uid: Date.now(), // 唯一uid
        name: resp.data.licensePhoto.split('/').pop(), // 文件名
        url: resp.data.licensePhoto
      })
    }

    console.log("pict",pict.value)
}
)

const submit=async ()=>{
    try{
      await formRef.value.validate()
    }catch(err){
      console.log(err)
      return 
    }
    const submitForm = { ...profile.value }
// =========修复这里==========
    if(pict.value.length && pict.value[0].response){
      // 新上传文件：取后端返回的 filePath
      submitForm.licensePhoto = pict.value[0].response.data.filePath
    }else if(pict.value.length && pict.value[0].url){
      // 页面回显旧图片（从后端加载出来的），pict[0].url是完整http地址
      submitForm.licensePhoto = pict.value[0].url
    }else{
      // 没有图片，沿用copy原始值
      submitForm.licensePhoto = copy.value.licensePhoto
    }
    submitForm.categories = submitForm.categories.join(',')
    await merchant_editCard(submitForm.id,submitForm)
    ElMessage.success("提交成功，等待后台确认")
}


</script>

<style scoped>
.modify-apply-edit {
  padding: 16px;
}
.readonly-info-block {
  padding:12px 16px;
  background-color: #f7f8fa;
  border-radius: 6px;
  margin-bottom:12px;
}
.label-title {
  font-weight:bold;
  margin-bottom:8px;
}
.info-item {
  display:flex;
  padding:6px 0;
}
.info-item .label {
  color:#666;
  width:70px;
}
.card-header {
  font-size:17px;
  font-weight:bold;
}
</style>
