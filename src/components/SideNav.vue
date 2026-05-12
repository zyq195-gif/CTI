<template>
  <aside class="side-nav">
    <div class="logo-area">
      <div class="brand-wrapper-horizontal">
        <img src="../assets/logo.svg" alt="CTI 华测检测" class="cti-svg-logo" />
        <div class="brand-divider"></div>
        <div class="system-name-box">
          <span class="system-title">AI 业务平台</span>
        </div>
      </div>
    </div>

    <nav class="nav-menu">
      <ul>
        <li v-for="(item, index) in menuItems" :key="index"
            :class="['menu-item', { active: activeIndex === index }]"
            @click="setActive(index)">
          <div class="icon-box">
            <i :class="item.icon"></i>
          </div>
          <span class="label">{{ item.name }}</span>
          <div class="active-indicator" v-if="activeIndex === index"></div>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

// 1. 定义 Props 接收当前选中的索引
const props = defineProps({
  activeIndex: {
    type: Number,
    default: 0
  }
})

// 2. 定义 Emits 向外发送切换事件
const emit = defineEmits(['change'])

const menuItems = ref([
  { name: 'AI 智能客服', icon: 'fa-solid fa-headset' },
  { name: '委托单管理', icon: 'fa-solid fa-file-signature' },
  { name: '现场数据采集', icon: 'fa-solid fa-layer-group' },
  { name: '技术方案管理', icon: 'fa-solid fa-microchip' },
  { name: '项目报价管理', icon: 'fa-solid fa-coins' },
  { name: '人员排单管理', icon: 'fa-solid fa-calendar-check' },
  { name: '电子原始记录', icon: 'fa-solid fa-database' },
  { name: '智能报告生成', icon: 'fa-solid fa-file-contract' },
  { name: '智能报告预审', icon: 'fa-solid fa-file-shield' }
])

const setActive = (index) => {
  // 3. 通知父组件索引改变了
  emit('change', index)
}
</script>

<style scoped>
/* 样式部分保持不变 */
.side-nav {
  width: 280px;
  height: 100vh;
  background: #FFFFFF;
  position: fixed;
  left: 0;
  top: 0;
  box-shadow: 4px 0 16px rgba(42, 63, 122, 0.05);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.logo-area {
  padding: 30px 24px;
  border-bottom: 1px solid #F0F2F5;
  margin-bottom: 16px;
}

.brand-wrapper-horizontal {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  height: 32px;
}

.cti-svg-logo {
  height: 26px;
  width: auto;
  display: block;
}

.brand-divider {
  width: 2px;
  height: 16px;
  background: #E2E8F0;
  border-radius: 1px;
}

.system-name-box {
  display: flex;
  align-items: center;
  transform: translateY(2px);
}

.system-title {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.5px;
  line-height: 1;
  margin: 0;
  white-space: nowrap; /* 核心：强制文字不换行 */
}

.nav-menu {
  flex: 1;
  padding: 0 16px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  margin-bottom: 8px;
  border-radius: 12px;
  cursor: pointer;
  color: #64748B;
  transition: all 0.3s ease;
  position: relative;
}

.icon-box {
  width: 32px;
  font-size: 16px;
}

.label {
  font-size: 15px;
  font-weight: 500;
}

.menu-item:hover {
  background: #F8FAFC;
  color: #2A3F7A;
}

.menu-item.active {
  background: #2A3F7A;
  color: #FFFFFF;
  box-shadow: 0 8px 16px rgba(42, 63, 122, 0.15);
}

.active-indicator {
  position: absolute;
  right: 12px;
  width: 4px;
  height: 4px;
  background: #FFFFFF;
  border-radius: 50%;
}
</style>