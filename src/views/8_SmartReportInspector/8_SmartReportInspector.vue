<template>
  <div class="report-generator-container">
    <div class="action-bar">
      <div class="bar-title">待审核报告</div>
      <div class="bar-actions" style="display: flex; align-items: center;gap: 10px;">
        <input
          v-model.trim="searchText"
          type="text"
          class="keyword-input"
          placeholder="搜索报告编号或标题..."
          style="width: 240px;"
        />
        <el-upload
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
        >
          <el-button type="primary" class="custom-upload-btn btn-primary" :loading="isUploading">
            <el-icon style="margin-right: 4px"><Upload /></el-icon> 上传报告
          </el-button>
        </el-upload>

        <button class="btn-danger" @click="handleBatchDelete">
          <i class="fa-solid fa-trash" style="margin-right: 4px;"></i> 删除
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="report-table">
        <thead>
          <tr>
            <th width="50">
              <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                <input type="checkbox" v-model="isAllSelected">
                <span class="cb-icon"></span>
              </label>
            </th>
            <th width="5%">序号</th>
            <th width="15%">报告编号</th>
            <th width="25%">标题</th>
            <th width="18%">审核问题</th>
            <th width="16%">创建时间</th>
            <th width="12%">处理进度</th>
            <th width="8%">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedData" :key="item.no">
            <td>
              <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                <input type="checkbox" :value="item.no" v-model="selectedIds">
                <span class="cb-icon"></span>
              </label>
            </td>
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="report-no">{{ item.no }}</td>
            <td class="normal-title">{{ item.title }}</td>
            <td class="issue-cell">
              <span v-if="item.issues.length > 0" class="issue-badge">
                {{ item.issues[0].shortDesc }}{{ item.issues.length > 1 ? '等 ' : ' ' }}{{ item.issues.length }}处异常
              </span>
              <span v-else class="issue-badge safe">无异常</span>
            </td>
            <td>{{ item.createTime }}</td>
            <td>
              <div v-if="item.progress < 100" class="progress-wrapper">
                <div class="progress-container">
                  <div class="progress-bar" :style="{ width: item.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ item.progress }}%</span>
              </div>
              <span v-else class="status-tag success">已审核</span>
            </td>
            <td class="table-actions">
              <span class="action-link" @click="viewDetail(item)">查看详情</span>
            </td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td colspan="8" class="empty-text">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="tableData.length > 0">
        <span class="total-text">共 {{ tableData.length }} 条</span>
        <select class="page-select" v-model="pageSize" @change="handleSizeChange">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
        </select>
        <div class="pager-btns">
          <span class="pager-arrow" :class="{ disabled: currentPage === 1 }" @click="prevPage">&lt;</span>
          <span class="pager-num active">{{ currentPage }}</span>
          <span class="pager-arrow" :class="{ disabled: currentPage === totalPages }" @click="nextPage">&gt;</span>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-container" :class="{ 'is-fullscreen': isFullscreen }">
        <div class="modal-header">
          <h3>智能审核详情 - {{ currentReport?.no }}</h3>
          <div class="header-actions">
            <button class="icon-btn" @click="toggleFullscreen" :title="isFullscreen ? '还原' : '最大化'">
              <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
            </button>
            <button class="close-btn" @click="closeModal" title="关闭">&times;</button>
          </div>
        </div>

<div class="modal-body">
          <div class="split-layout">
            <div class="pdf-panel">
              <iframe
                v-if="currentReport"
                :key="dynamicPdfUrl" :src="dynamicPdfUrl"  width="100%"
                height="100%"
                frameborder="0"
                style="border: none; display: block;"
              ></iframe>
            </div>
            <div class="issue-panel">
              <div class="issue-panel-title">检测异常与修改建议</div>
              <div v-if="currentReport?.issues?.length > 0" class="issue-cards">
                <div
                  class="issue-card clickable-card"
                  v-for="(issue, idx) in currentReport.issues"
                  :key="idx"
                  @click="jumpToIssue(issue)"
                >
                  <div class="issue-tag">{{ issue.type }}</div>
                  <div class="issue-content">
                    <p class="issue-original"><span class="label">【原文段】</span>{{ issue.originalText }}</p>
                    <p class="issue-suggest"><span class="label">【建　议】</span>{{ issue.suggestion }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="issue-empty">
                <i class="fa-solid fa-circle-check" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p>未发现异常问题</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
<button class="btn-primary download-btn" @click="exportErrorReport">
  <i class="fa-solid fa-file-export" style="margin-right: 5px;"></i> 导出错误报告
</button>
       </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Upload } from '@element-plus/icons-vue';

// ====== 1. 修改模拟数据，加上所在页码(page)和搜索关键词(keyword) ======
const defaultList = [];
for (let i = 1; i <= 15; i++) {
  const hasIssue = i % 3 !== 0;
  const issues = hasIssue ? [
    {
      shortDesc: '规范废止', type: '标准引用错误',
      originalText: '依据《混凝土结构工程施工质量验收规范》GB 50204-2002执行本项目的验收...',
      suggestion: '该规范已废止，建议更新为现行规范 GB 50204-2015',
      page: 1, // 模拟所在页码
      keyword: 'GB 50204-2002' // 触发 PDF 原生高亮搜索的关键词
    },
    {
      shortDesc: '错别字', type: '用词不当',
      originalText: '使用回弹仪检测混泥土抗压强度，发现多处异常...',
      suggestion: '“混泥土”为明显错别字，应修改为“混凝土”',
      page: 2,
      keyword: '混泥土'
    }
  ].slice(0, (i % 2) + 1) : [];

  defaultList.push({
    no: `CTI-AUD-2026${String(i).padStart(4, '0')}`,
    title: i % 2 !== 0 ? `AI智能审核报告 - 第${i}版` : `某商业中心项目检测报告 - 0${i}`,
    issues: issues,
    createTime: `2026-05-${String(Math.ceil(i/3)).padStart(2, '0')} 15:30:00`,
    progress: i <= 3 ? i * 25 : 100
  });
}

const tableData = ref(defaultList);
const currentPage = ref(1);
const pageSize = ref(10);
const isUploading = ref(false);

const selectedIds = ref([]);
const isAllSelected = computed({
  get: () => tableData.value.length > 0 && selectedIds.value.length === paginatedData.value.length,
  set: (val) => {
    selectedIds.value = val ? paginatedData.value.map(item => item.no) : [];
  }
});

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return alert('请先选择需要删除的报告');
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`)) {
    tableData.value = tableData.value.filter(item => !selectedIds.value.includes(item.no));
    selectedIds.value = [];
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value;
    }
  }
};

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return tableData.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.ceil(tableData.value.length / pageSize.value));
const handleSizeChange = () => { currentPage.value = 1; selectedIds.value = []; };
const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; selectedIds.value = []; } };
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; selectedIds.value = []; } };

const handleFileChange = () => { alert('审核报告上传成功！'); };

// ====== 2. 将静态 URL 改为响应式变量，并增加跳转函数 ======
const showDetailModal = ref(false);
const currentReport = ref(null);
const isFullscreen = ref(false);

const basePdfUrl = '/huace/7.智能报告模板.pdf';
const dynamicPdfUrl = ref(encodeURI(basePdfUrl)); // 响应式的 iframe 链接

// 点击查看详情时，重置回默认链接
const viewDetail = (item) => {
  currentReport.value = item;
  dynamicPdfUrl.value = encodeURI(basePdfUrl); // 重置为首页
  showDetailModal.value = true;
};

// 【新增】：点击异常卡片，触发 iframe 跳转并高亮
const jumpToIssue = (issue) => {
  if (!issue.page && !issue.keyword) return;
  // 利用原生 PDF 参数: #page=页码&search=搜索词
  const hashParams = `#page=${issue.page || 1}&search=${encodeURIComponent(issue.keyword || '')}`;
  dynamicPdfUrl.value = encodeURI(basePdfUrl) + hashParams;
};

const toggleFullscreen = () => isFullscreen.value = !isFullscreen.value;
const closeModal = () => { showDetailModal.value = false; currentReport.value = null; isFullscreen.value = false; };
// 修改后的导出逻辑
const exportErrorReport = () => {
  if (!currentReport.value || !currentReport.value.issues.length) {
    alert('当前报告无异常记录，无需导出。');
    return;
  }

  // 1. 定义表头
  const headers = ['页码', '错误原因', '原文文段', '修改建议'];

  // 2. 提取并格式化数据行
  const rows = currentReport.value.issues.map(issue => [
    issue.page || '-',      // 页码
    issue.type,             // 错误原因/类型
    `"${issue.originalText.replace(/"/g, '""')}"`, // 原文（加引号防止内容里有逗号导致错位）
    `"${issue.suggestion.replace(/"/g, '""')}"`    // 修改建议
  ]);

  // 3. 组合成 CSV 字符串
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  // 4. 创建 Blob 并触发下载 (添加 \ufeff 字符防止 Excel 打开中文乱码)
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `错误详情清单_${currentReport.value.no}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

</script>

<style scoped>
.report-generator-container { padding: 20px; background-color: #f5f7fa; min-height: calc(100vh - 60px); }
.action-bar { display: flex; justify-content: space-between; align-items: center; background-color: #ffffff; padding: 16px 20px; border-radius: 4px; margin-bottom: 20px; border: 1px solid #ebeef5; }
.bar-title {
  font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important;
  font-size: 20px;
  font-weight: bold;
  color: #2a3f7a; /* 华测深蓝色 */
  border-left: 4px solid #2a3f7a; /* 左侧加粗竖条 */
  padding-left: 12px;
  line-height: 1.2;
  margin: 0;
  display: inline-block;
}
.btn-primary { background-color: #2a3f74; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; }
.custom-upload-btn { background-color: #2a3f74 !important; border-color: #2a3f74 !important; }
.custom-upload-btn:hover { background-color: #3e5a9e !important; }
.table-wrapper { background-color: #ffffff; padding: 20px; border-radius: 4px; border: 1px solid #ebeef5; }
.report-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 14px; color: #606266; }
.report-table th, .report-table td { padding: 14px 10px; border-bottom: 1px solid #ebeef5; }
.report-table th { color: #909399; font-weight: 500; }
.report-table tbody tr:hover { background-color: #f5f7fa; }
.empty-text { padding: 40px 0 !important; color: #909399; }

/* 统一异常标签的大小，使其与已审核标签完全一致 */
.issue-badge {
  display: inline-block !important;
  padding: 2px 6px !important;     /* 👈 对齐处理进度的 padding */
  line-height: 1.2 !important;     /* 👈 对齐处理进度的 line-height */
  border-radius: 4px !important;
  font-size: 12px !important;
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}
.issue-badge.safe {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.progress-wrapper { display: flex; align-items: center; justify-content: center; gap: 8px; }
.progress-container { background-color: #ebeef5; border-radius: 6px; overflow: hidden; height: 6px; width: 60px; }
.progress-bar { height: 100%; background-color: #2a3f74; transition: width 0.3s ease; }
.progress-text { font-size: 12px; color: #909399; width: 28px; text-align: right; }
.status-tag {
  display: inline-block !important;
  /* 👇 统一为 2px 6px */
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
}
.status-tag.success { background-color: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }

.table-actions { display: flex; justify-content: center; gap: 15px; }
.action-link { color: #2a3f74; cursor: pointer; font-size: 14px; user-select: none; }
.action-link:hover { opacity: 0.8; text-decoration: underline; }

.pagination { display: flex; justify-content: flex-end; align-items: center; margin-top: 20px; font-size: 13px; color: #606266; }
.total-text { margin-right: 15px; }
.page-select { padding: 2px 5px; border: 1px solid #dcdfe6; border-radius: 4px; margin-right: 15px; color: #606266; }
.pager-btns { display: flex; align-items: center; gap: 5px; }
.pager-arrow, .pager-num { display: inline-flex; justify-content: center; align-items: center; width: 28px; height: 28px; background-color: #f4f4f5; border-radius: 4px; cursor: pointer; }
.pager-arrow.disabled { color: #c0c4cc; cursor: not-allowed; }
.pager-num.active { background-color: #2a3f74; color: #fff; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
/* 修改点：弹窗变宽以适应分栏 */
.modal-container { background-color: #ffffff; width: 1200px; max-width: 95%; height: 85vh; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; }
.modal-container.is-fullscreen { width: 100vw; height: 100vh; max-width: 100%; border-radius: 0; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background-color: #f8f9fa; border-bottom: 1px solid #ebeef5; }
.modal-header h3 { margin: 0; font-size: 18px; color: #1e293b; border-left: 4px solid #2a3f74; padding-left: 10px; font-weight: 600; }
.header-actions { display: flex; align-items: center; gap: 16px; }
.icon-btn { background: none; border: none; font-size: 18px; color: #909399; cursor: pointer; }
.icon-btn:hover { color: #2a3f74; }
.close-btn { background: none; border: none; font-size: 28px; color: #909399; cursor: pointer; }
.close-btn:hover { color: #f56c6c; }
.modal-body { flex: 1; padding: 0; overflow: hidden; display: flex; }
.modal-footer { padding: 12px 20px; background-color: #ffffff; border-top: 1px solid #ebeef5; display: flex; justify-content: flex-end; }
.download-btn { background-color: #2a3f74; color: #ffffff; border: none; padding: 8px 24px; border-radius: 4px; font-size: 14px; cursor: pointer; }
.download-btn:hover { background-color: #1d2c52; }

/* 批量删除及复选框样式 */
.btn-danger { background-color: #f56c6c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; transition: background-color 0.3s; }
.btn-danger:hover { background-color: #f78989; }
.cb-wrap { display: inline-flex; align-items: center; cursor: pointer; user-select: none; }
.cb-wrap input { display: none; }
.cb-icon { width: 16px; height: 16px; border: 2px solid #dcdfe6; border-radius: 3px; display: inline-block; position: relative; transition: all 0.2s; }
.cb-wrap input:checked + .cb-icon { background: #2a3f74; border-color: #2a3f74; }
.cb-wrap input:checked + .cb-icon::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

/* 修改点：弹窗分栏样式 */
.split-layout { display: flex; width: 100%; height: 100%; }
.pdf-panel { flex: 6; background-color: #525659; border-right: 1px solid #ebeef5; }
.issue-panel { flex: 4; background-color: #f8f9fa; padding: 20px; overflow-y: auto; }
.issue-panel-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 16px; border-bottom: 2px solid #e3e9f3; padding-bottom: 10px; }
.issue-card { background: #fff; border: 1px solid #fde2e2; border-radius: 6px; padding: 12px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(245,108,108,0.05); border-left: 4px solid #f56c6c; }
.issue-tag {
  display: inline-block !important;
  /* 👇 统一为 2px 6px */
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-weight: bold !important; /* 保持红色标签的提醒力度 */
  margin-bottom: 0 !important; /* 确保在表格行内垂直居中 */
}
.issue-content p { margin: 0 0 8px 0; font-size: 13px; color: #333; line-height: 1.5; }
.issue-content p:last-child { margin-bottom: 0; }
.issue-content .label { color: #909399; font-weight: bold; }
.issue-suggest { color: #e6a23c !important; }
.issue-empty { text-align: center; color: #67c23a; padding-top: 60px; }

/* ==========================================
   强制对齐第三模块的表格行间距与字号
   ========================================== */
.quotation-table th,
.quotation-table td,
.item-table th,
.item-table td {
  padding: 14px 12px !important; /* 👈 这里的 14px 是控制上下行间距的核心 */
  font-size: 13px !important;    /* 👈 强制缩小到 13px，防止大字体把行距撑高 */
  line-height: 1.5 !important;   /* 👈 统一文字的行高比例 */
  height: auto !important;
}

.quotation-table, .item-table {
  font-size: 13px !important;
}



</style>
<style>
/* ==========================================
   终极无差别覆盖：强行压缩所有【审核问题】红色标签
   ========================================== */
:deep(.issue-tag),
.issue-tag {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 22px !important;          /* 👈 强制写死绝对高度 */
  min-height: 22px !important;
  line-height: normal !important;   /* 👈 剔除所有行高干扰 */
  padding: 0 6px !important;        /* 👈 剔除上下内边距，靠 height 居中 */
  font-size: 12px !important;       /* 👈 强制缩小字号 */
  border-radius: 4px !important;    /* 👈 统一小圆角 */
  font-weight: 500 !important;      /* 👈 减轻字重，去除过粗效果 */
  box-sizing: border-box !important;
  white-space: nowrap !important;
  margin: 2px 4px 2px 0 !important; /* 👈 多个标签换行时保留微小间距 */
  vertical-align: middle !important;

  /* 如果是 Element Plus 的 el-tag，强制覆盖其内部变量 */
  --el-tag-height: 22px !important;
  --el-tag-padding: 0 6px !important;
}

/* 防止标签把单元格撑高，确保内容居中 */
:deep(.report-table td) {
  vertical-align: middle !important;
}

/* ==========================================
   1. 强制对齐第六模块(报告生成)的表格行间距与字号
   ========================================== */
.report-table th,
.report-table td {
  padding: 12px 12px !important; /* 对齐第六模块的内边距 */
  font-size: 13px !important;    /* 缩小字号对齐第六模块 */
 height: auto !important;     /* 强制限制整行高度为48px */
  box-sizing: border-box !important;
}

/* ==========================================
   2. 强制对齐顶部“上传报告”与原生按钮的大小
   ========================================== */
/* 抹平 Element 组件按钮与原生按钮的差异，强行统一长宽与间距 */
.action-bar .btn-primary,
.action-bar .btn-danger,
.action-bar .custom-upload-btn {
  height: 34px !important;             /* 统一固定高度 */
  padding: 0 16px !important;          /* 统一左右间距 */
  font-size: 14px !important;
  border-radius: 4px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  line-height: normal !important;
}

/* 抵消 el-upload 包裹容器可能带来的高度偏移，让按钮绝对居中对齐 */
.bar-actions .el-upload {
  display: inline-flex;
  align-items: center;
}

.list-view .action-bar .bar-actions .keyword-input.search-box {
  display: inline-block !important;
  visibility: visible !important;
  /* 👇 核心修改：高度从 32px 改为 38px */
  height: 38px !important;
  border: 1px solid #dfe7f2 !important;
  /* 👇 核心修改：圆角从 4px 改为 10px */
  border-radius: 10px !important;
  padding: 0 12px !important;
  font-size: 14px !important;
  outline: none !important;
  box-sizing: border-box !important;
  color: #1e293b !important;
  background-color: #f8fafd !important;
  margin: 0 !important;
  transition: all 0.2s !important;
}

.list-view .action-bar .bar-actions .keyword-input.search-box:focus {
  border-color: #2a3f7a !important;
  background-color: #fff !important;
}

.keyword-input {
  height: 38px !important;
  border: 1px solid #dfe7f2 !important;
  border-radius: 10px !important;
  padding: 0 12px !important;
  font-size: 14px !important;
  outline: none !important;
  box-sizing: border-box !important;
  color: #1e293b !important;
  background-color: #f8fafd !important;
  transition: all 0.2s !important;
}
.keyword-input:focus {
  border-color: #2a3f7a !important;
  background-color: #fff !important;
}

/* 1. 报告编号：加粗 + 华测蓝 */
.report-no {
  color: #2a3f7a !important;
  font-weight: 700 !important;
}

/* 2. 标题：取消加粗 */
.normal-title {
  font-weight: normal !important;
  color: #1e293b !important;
}

/* 3. 统一表格字体对齐第五模块 */
.report-table {
  width: 100% !important;
  font-size: 13px !important;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
}

</style>