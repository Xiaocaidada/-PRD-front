import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as Icons from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import 'element-plus/theme-chalk/dark/css-vars.css'
const app = createApp(App)
for (const [name, comp] of Object.entries(Icons)) {
  app.component(name, comp)
}
app.use(ElementPlus, { locale: zhCn })
app.use(router)
app.mount('#app')
