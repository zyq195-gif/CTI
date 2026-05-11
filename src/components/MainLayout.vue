<template>
  <div class="bs-admin-layout">
    <SideNav
      :active-index="activeIndex"
      @change="(idx) => $emit('change-page', idx)"
    />

    <div class="main-container">
      <TopNav />

      <main class="scrollable-content">
        <div class="page-card">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import SideNav from './SideNav.vue'
import TopNav from './TopNav.vue'

// 2. 定义 Props 接收 App.vue 传来的索引
defineProps({
  activeIndex: {
    type: Number,
    default: 0
  }
})

// 3. 定义向外传递的事件
defineEmits(['change-page'])
</script>

<style scoped>
.bs-admin-layout {
  /* 脱离 style.css 中 #app 的 1126px 宽度限制 */
  position: fixed;
  top: 0;
  left: 0;
  text-align: left; /* 修正文字居中问题 */

  display: flex;
  width: 100vw;
  height: 100vh;
  z-index: 10;
}

.main-container {
  flex: 1;
  /* 🚨 救命代码：把 280px 加回来！给侧边栏让出位置，不被盖住 */
  margin-left: 280px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F4F7FB;
  min-width: 0;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.page-card {
  background: #FFFFFF;
  border-radius: 16px;
  min-height: calc(100vh - 80px - 48px);
  box-shadow: 0 4px 12px rgba(42, 63, 122, 0.04);
  padding: 32px;
  display: flex;
  flex-direction: column;
}
</style>