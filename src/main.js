import { createApp } from 'vue'
import App from './App.vue'

// 1. 引入原有的基础样式 (建议保留)
import './style.css'


// 3. 引入 Element Plus 及其样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 4. 引入 Element Plus 的图标库
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 5. 全局注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// =====================================
// 2. 引入新增的华测全局统一主题样式
// =====================================
import './assets/huace-theme.css'

// 6. 挂载 Element Plus 并启动应用
app.use(ElementPlus)
app.mount('#app')