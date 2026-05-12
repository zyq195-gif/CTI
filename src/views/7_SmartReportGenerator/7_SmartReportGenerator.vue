<template>
  <div class="report-generator-container">
    <div class="action-bar">
      <div class="bar-title">报告生成</div>
      <div class="bar-actions" style="display: flex; align-items: center; gap: 10px;">
        <input
          v-model.trim="searchText"
          type="text"
          class="keyword-input"
          placeholder="搜索报告编号或标题..."
          style="width: 240px;"
        />
        <button class="btn-primary" @click="openUploadModal">
          <i class="fa-solid fa-upload" style="margin-right: 4px;"></i> 上传资料
        </button>
        <button class="btn-danger"  @click="handleBatchDelete">
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
            <th width="80">序号</th>
            <th width="180">报告编号</th>
            <th width="300">标题</th>
            <th width="180">创建时间</th>
            <th width="150">生成进度</th>
            <th width="120">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedData" :key="item.id">
            <td>
              <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                <input type="checkbox" :value="item.id" v-model="selectedIds">
                <span class="cb-icon"></span>
              </label>
            </td>
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="report-no">{{ item.reportNo }}</td>
            <td class="normal-title">{{ item.title }}</td>
            <td>{{ item.createTime }}</td>
            <td>
              <div v-if="item.progress < 100" class="progress-wrapper">
                <div class="progress-container">
                  <div class="progress-bar" :style="{ width: item.progress + '%' }"></div>
                </div>
                <span class="progress-text">{{ item.progress }}%</span>
              </div>
              <span v-else class="status-tag success">已生成</span>
            </td>
            <td class="table-actions">
              <span class="action-link" @click="viewDetail(item)">查看详情</span>
            </td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td colspan="7" class="empty-text">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" v-if="tableData.length > 0">
        <span class="total-text">共 {{ tableData.length }} 条</span>

        <select class="page-select" v-model="pageSize" @change="handleSizeChange">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="30">30条/页</option>
        </select>

        <div class="pager-btns">
          <span class="pager-arrow" :class="{ disabled: currentPage === 1 }" @click="prevPage">&lt;</span>
          <span class="pager-num active">{{ currentPage }}</span>
          <span class="pager-arrow" :class="{ disabled: currentPage === totalPages }" @click="nextPage">&gt;</span>
        </div>
      </div>
    </div>

    <!-- 上传资料弹窗 -->
    <div class="modal-overlay" v-if="showUploadModal" @click.self="closeUploadModal">
    <div class="modal-container upload-modal" style="width: 600px; max-width: 90%;">
        <div class="modal-header">
          <h3>上传资料</h3>
          <div class="header-actions">
            <button class="close-btn" @click="closeUploadModal">&times;</button>
          </div>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <!-- 技术方案上传 -->
          <div class="upload-item">
            <div class="upload-label">技术方案上传</div>
            <div class="upload-control">
              <button class="btn-select" @click="triggerTechFileInput">选择文件</button>
              <span class="file-name">{{ techFileName || '未选择任何文件' }}</span>
              <input type="file" ref="techFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display: none;" @change="handleTechFileChange" />
            </div>
          </div>
          <!-- 委托单上传 -->
          <div class="upload-item">
            <div class="upload-label">委托单上传</div>
            <div class="upload-control">
              <button class="btn-select" @click="triggerEntrustFileInput">选择文件</button>
              <span class="file-name">{{ entrustFileName || '未选择任何文件' }}</span>
              <input type="file" ref="entrustFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display: none;" @change="handleEntrustFileChange" />
            </div>
          </div>
          <!-- 电子原始记录上传 -->
          <div class="upload-item">
            <div class="upload-label">电子原始记录上传</div>
            <div class="upload-control">
              <button class="btn-select" @click="triggerOriginalFileInput">选择文件</button>
              <span class="file-name">{{ originalFileName || '未选择任何文件' }}</span>
              <input type="file" ref="originalFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" style="display: none;" @change="handleOriginalFileChange" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="confirmUpload">确 认</button>
          <button class="btn-secondary" @click="closeUploadModal" style="margin-left: 10px;">取 消</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showDetailModal">
      <div class="modal-container" :class="{ 'is-fullscreen': isFullscreen }">
        <div class="modal-header">
          <h3>报告详情 - {{ currentReport?.reportNo }}</h3>
          <div class="header-actions">
            <button class="icon-btn" @click="toggleFullscreen" :title="isFullscreen ? '还原' : '最大化'">
              <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
            </button>
            <button class="close-btn" @click="closeModal" title="关闭">
              &times;
            </button>
          </div>
        </div>

        <div class="modal-body">
          <iframe
            v-if="currentReport"
            :src="pdfPreviewUrl"
            width="100%"
            height="100%"
            frameborder="0"
            style="border: none; display: block;"
          ></iframe>
        </div>

        <div class="modal-footer">
          <button class="btn-primary download-btn" @click="downloadReport">
            <i class="fa-solid fa-download" style="margin-right: 5px;"></i> 下载报告
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const defaultList = [];
for (let i = 1; i <= 15; i++) {
  defaultList.push({
    id: i,
    reportNo: `CTI-REP-2026${String(i).padStart(4, '0')}`,
    title: i % 2 !== 0 ? `AI智能检测生成报告 - 第${i}版` : `某建筑工地地基沉降监测方案 - 0${i}`,
    createTime: `2026-05-${String(Math.ceil(i/3)).padStart(2, '0')} 14:20:00`,
    progress: i <= 3 ? i * 20 : 100
  });
}
const tableData = ref(defaultList);
let reportCounter = 16;

const currentPage = ref(1);
const pageSize = ref(10);

// --- 批量删除逻辑 ---
const selectedIds = ref([]);
const isAllSelected = computed({
  get: () => tableData.value.length > 0 && selectedIds.value.length === paginatedData.value.length,
  set: (val) => {
    selectedIds.value = val ? paginatedData.value.map(item => item.id) : [];
  }
});

const handleBatchDelete = () => {
  if (selectedIds.value.length === 0) return alert('请先选择需要删除的报告');
  if (confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`)) {
    tableData.value = tableData.value.filter(item => !selectedIds.value.includes(item.id));
    selectedIds.value = [];
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value;
    }
  }
};

const searchText = ref(''); // 1. 定义搜索变量

// 2. 新增过滤后的数据计算属性
const filteredData = computed(() => {
  if (!searchText.value) return tableData.value;
  const kw = searchText.value.toLowerCase();
  return tableData.value.filter(item =>
    item.reportNo.toLowerCase().includes(kw) ||
    item.title.toLowerCase().includes(kw)
  );
});

// 3. 修改分页逻辑，将数据源从 tableData 改为 filteredData
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value));
const handleSizeChange = () => { currentPage.value = 1; selectedIds.value = []; };
const prevPage = () => { if (currentPage.value > 1) { currentPage.value--; selectedIds.value = []; } };
const nextPage = () => { if (currentPage.value < totalPages.value) { currentPage.value++; selectedIds.value = []; } };

// 上传弹窗显示控制
const showUploadModal = ref(false);

// 三个文件相关的 ref（用于触发隐藏的 file input）
const techFileInput = ref(null);
const entrustFileInput = ref(null);
const originalFileInput = ref(null);

// 存储文件名用于显示
const techFileName = ref('');
const entrustFileName = ref('');
const originalFileName = ref('');

// 存储实际文件对象（可选，用于后续提交）
const techFileObj = ref(null);
const entrustFileObj = ref(null);
const originalFileObj = ref(null);
// 打开弹窗（可重置状态）
const openUploadModal = () => {
  // 重置所有文件选择状态
  techFileName.value = '';
  entrustFileName.value = '';
  originalFileName.value = '';
  techFileObj.value = null;
  entrustFileObj.value = null;
  originalFileObj.value = null;
  showUploadModal.value = true;
};

// 关闭弹窗
const closeUploadModal = () => {
  showUploadModal.value = false;
};

// 触发对应的文件选择框
const triggerTechFileInput = () => techFileInput.value.click();
const triggerEntrustFileInput = () => entrustFileInput.value.click();
const triggerOriginalFileInput = () => originalFileInput.value.click();

// 处理技术方案文件选择
const handleTechFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    techFileName.value = file.name;
    techFileObj.value = file;
  } else {
    techFileName.value = '';
    techFileObj.value = null;
  }
  // 清空 input 的 value，以便再次选择同一个文件时能触发 change
  event.target.value = '';
};

// 委托单文件选择处理
const handleEntrustFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    entrustFileName.value = file.name;
    entrustFileObj.value = file;
  } else {
    entrustFileName.value = '';
    entrustFileObj.value = null;
  }
  event.target.value = '';
};

// 电子原始记录文件选择处理
const handleOriginalFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    originalFileName.value = file.name;
    originalFileObj.value = file;
  } else {
    originalFileName.value = '';
    originalFileObj.value = null;
  }
  event.target.value = '';
};

// 确认上传（模拟提交）
const confirmUpload = () => {
  const filesInfo = [
    { type: '技术方案', name: techFileName.value || '未上传' },
    { type: '委托单', name: entrustFileName.value || '未上传' },
    { type: '电子原始记录', name: originalFileName.value || '未上传' }
  ];
  console.log('上传的文件信息：', filesInfo);
  alert(`已收到以下资料：\n${filesInfo.map(f => `${f.type}：${f.name}`).join('\n')}`);
  // 此处可增加实际上传逻辑，如 FormData 提交
  closeUploadModal();
};

const showDetailModal = ref(false);
const currentReport = ref(null);
const isFullscreen = ref(false);
const pdfPreviewUrl = encodeURI(`${import.meta.env.BASE_URL}7.智能报告模板.pdf`);

const viewDetail = (item) => { currentReport.value = item; showDetailModal.value = true; };
const toggleFullscreen = () => isFullscreen.value = !isFullscreen.value;
const closeModal = () => { showDetailModal.value = false; currentReport.value = null; isFullscreen.value = false; };
const downloadReport = () => { alert('下载报告成功！'); };
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
.btn-primary:hover { background-color: #3e5a9e; }
.table-wrapper { background-color: #ffffff; padding: 20px; border-radius: 4px; border: 1px solid #ebeef5; }
.report-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 14px; color: #606266; }
.report-table th, .report-table td { padding: 0px 12px; border-bottom: 1px solid #ebeef5; }
.report-table th { color: #909399; font-weight: 500; }
.report-table tbody tr:hover { background-color: #f5f7fa; }
.empty-text { padding: 40px 0 !important; color: #909399; }
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

.progress-wrapper { display: flex; align-items: center; justify-content: center; gap: 8px; }
.progress-container { background-color: #ebeef5; border-radius: 6px; overflow: hidden; height: 6px; width: 60px; }
.progress-bar { height: 100%; background-color: #2a3f74; transition: width 0.3s ease; }
.progress-text { font-size: 12px; color: #909399; width: 28px; text-align: right; }
.status-tag {
  display: inline-block !important;
  /* 👇 核心修改：从 4px 8px 改为 2px 6px */
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-weight: normal !important;
  line-height: 1.2 !important;
}
.status-tag.success { background-color: #f0f9eb; color: #67c23a; border: 1px solid #e1f3d8; }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-container { background-color: #ffffff; width: 850px; max-width: 95%; height: 85vh; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s ease; }
.modal-container.is-fullscreen { width: 100vw; height: 100vh; max-width: 100%; border-radius: 0; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background-color: #f8f9fa; border-bottom: 1px solid #ebeef5; }
.modal-header h3 { margin: 0; font-size: 18px; color: #1e293b; border-left: 4px solid #2a3f74; padding-left: 10px; font-weight: 600; }
.header-actions { display: flex; align-items: center; gap: 16px; }
.icon-btn { background: none; border: none; font-size: 18px; color: #909399; cursor: pointer; }
.icon-btn:hover { color: #2a3f74; }
.close-btn { background: none; border: none; font-size: 28px; color: #909399; cursor: pointer; }
.close-btn:hover { color: #f56c6c; }
.modal-body { flex: 1; padding: 0; background-color: #525659; overflow: hidden; display: flex; }
.modal-footer { padding: 12px 20px; background-color: #ffffff; border-top: 1px solid #ebeef5; display: flex; justify-content: flex-end; }
.download-btn { background-color: #2a3f74; color: #ffffff; border: none; padding: 8px 24px; border-radius: 4px; font-size: 14px; cursor: pointer; }
.download-btn:hover { background-color: #1d2c52; }

/* ===== 新增的批量删除及复选框样式 ===== */
.btn-danger {
  background-color: #f56c6c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; display: inline-flex; align-items: center; transition: background-color 0.3s;
}
.btn-danger:hover { background-color: #f78989; }

.cb-wrap { display: inline-flex; align-items: center; cursor: pointer; user-select: none; }
.cb-wrap input { display: none; }
.cb-icon { width: 16px; height: 16px; border: 2px solid #dcdfe6; border-radius: 3px; display: inline-block; position: relative; transition: all 0.2s; }
.cb-wrap input:checked + .cb-icon { background: #2a3f74; border-color: #2a3f74; }
.cb-wrap input:checked + .cb-icon::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }

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

/* ==========================================
   强制终极覆盖：第7模块行间距与按钮高度压缩
   ========================================== */
.report-table th,
.report-table td {
  padding: 12px 12px !important; /* 强制缩小单元格内边距 */
  font-size: 13px !important;
  height: auto !important; /* 强制限制整行的高度 */
  box-sizing: border-box !important;
}

/* 强制把表格里的“下载”等实体按钮压扁，防止它们把行高撑大 */
.report-table .download-btn,
.report-table button {
  height: 26px !important;
  min-height: 26px !important;
  line-height: 24px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  border-radius: 4px !important;
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

/* 2. 标题：取消加粗（常规粗细） */
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


/* ==========================================
   上传资料弹窗 - 对齐第六模块设计风格
   ========================================== */
/* ==========================================
   上传资料弹窗 - 对齐第六模块设计风格 + 自适应高度
   ========================================== */
.modal-container.upload-modal {
  border-radius: 18px !important;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24) !important;
  background-color: #ffffff !important;
  overflow: hidden !important;
  height: auto !important;           /* 👈 关键：高度由内容撑开 */
  max-height: 90vh !important;       /* 👈 安全限制 */
  width: 600px !important;
  max-width: 90% !important;
}

/* 其余头部、主体、底部样式保持不变... */
/* 弹窗头部 */
.modal-container.upload-modal .modal-header {
  padding: 24px 26px !important;
  background-color: #ffffff !important;
  border-bottom: 1px solid #edf2f7 !important;
}

.modal-container.upload-modal .modal-header h3 {
  border-left: 4px solid #2a3f7a !important;
  padding-left: 12px !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  color: #2a3f7a !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}

/* 关闭按钮样式对齐第六模块 */
.modal-container.upload-modal .modal-header .close-btn {
  font-size: 28px !important;
  background: transparent !important;
  border: none !important;
  color: #909399 !important;
  cursor: pointer !important;
  transition: color 0.2s !important;
}
.modal-container.upload-modal .modal-header .close-btn:hover {
  color: #f56c6c !important;
}

/* 弹窗主体 - 覆盖默认深灰背景 */
.modal-container.upload-modal .modal-body {
  background-color: #ffffff !important;
  display: block !important;
  padding: 26px !important;
  overflow-y: auto !important;
}

/* 上传项布局 (对齐第六模块表单布局) */
.upload-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #edf2f7;
  justify-content: center;
}

.upload-label {
  width: 120px;
  font-size: 14px;
  font-weight: 600;
  color: #2a3f7a;
  justify-content: center;
}

.upload-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: right;   /* 新增：让按钮和文件名水平居中 */
  gap: 12px;
}

/* 选择文件按钮 - 与第六模块的 .light-btn / .primary-btn 风格一致 */
.btn-select {
  background: #f2f5fb !important;
  border: 1px solid #e3e9f3 !important;
  color: #2a3f7a !important;
  padding: 8px 16px !important;
  border-radius: 10px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  height: 38px !important;
  line-height: 1 !important;
}
.btn-select:hover {
  background: #e9eef6 !important;
  border-color: #2a3f7a !important;
  transform: translateY(-1px);
}

/* 文件名显示 */
.file-name {
  font-size: 13px;
  color: #334155;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹窗底部按钮 - 对齐第六模块 */
.modal-container.upload-modal .modal-footer {
  padding: 18px 26px 24px !important;
  background-color: #ffffff !important;
  border-top: 1px solid #edf2f7 !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
}

.modal-container.upload-modal .modal-footer .btn-primary {
  background: #2a3f7a !important;
  border: none !important;
  color: #fff !important;
  padding: 10px 20px !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}
.modal-container.upload-modal .modal-footer .btn-primary:hover {
  background: #3e5a9e !important;
  transform: translateY(-1px);
}

.modal-container.upload-modal .modal-footer .btn-secondary {
  background: #f2f5fb !important;
  border: 1px solid #e3e9f3 !important;
  color: #2a3f7a !important;
  padding: 9px 19px !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}
.modal-container.upload-modal .modal-footer .btn-secondary:hover {
  background: #e9eef6 !important;
  transform: translateY(-1px);
}



</style>