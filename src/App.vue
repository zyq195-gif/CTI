<template>
  <MainLayout :active-index="currentIdx" @change-page="handlePageChange">
    <component :is="viewComponents[currentIdx]" />
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue'
import MainLayout from './components/MainLayout.vue'

// 1. 导入所有业务页面组件
import AIChatService from './views/1_AIChatService/1_AIChatService.vue'
import EntrustmentManager from './views/1.5_EntrustmentManager/EntrustmentManager.vue'
import FieldDataCollection from './views/2_FieldDataCollection/2_FieldDataCollection.vue'
import TechSchemeManager from './views/3_TechSchemeManager/3_TechSchemeManager.vue'
import AIQuotationAssistant from './views/4_AIQuotationAssistant/4_AIQuotationAssistant.vue'
import StaffScheduling from './views/5_StaffScheduling/5_StaffScheduling.vue'
// 👇 核心修正点：文件名必须加上 6_ 前缀
import DigitalOriginalRecord from './views/6_DigitalOriginalRecord/6_DigitalOriginalRecord.vue'
import SmartReportGenerator from './views/7_SmartReportGenerator/7_SmartReportGenerator.vue'
import SmartReportInspector from './views/8_SmartReportInspector/8_SmartReportInspector.vue'

// 2. 按照侧边栏菜单的顺序排列组件数组
const viewComponents = [
  AIChatService,          // 0: AI 智能客服
  EntrustmentManager,     // 1: 委托单管理 (置于 1.5 位置)
  FieldDataCollection,    // 2: 现场数据采集
  TechSchemeManager,      // 3: 技术方案管理
  AIQuotationAssistant,   // 4: 项目报价管理
  StaffScheduling,        // 5: 人员排单管理
  DigitalOriginalRecord,  // 6: 电子原始记录
  SmartReportGenerator,   // 7: 智能报告生成
  SmartReportInspector    // 8: 智能报告预审
]

// 3. 当前激活页面的索引状态
const currentIdx = ref(0)

/**
 * 处理页面切换
 * @param {number} index 侧边栏传递的目标索引
 */
const handlePageChange = (index) => {
  currentIdx.value = index
}
</script>

<style>
/* 基础全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100vw;
  height: 100vh;
  overflow: hidden; /* 防止窗口出现双滚动条 */
  background-color: #F4F7FB;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>