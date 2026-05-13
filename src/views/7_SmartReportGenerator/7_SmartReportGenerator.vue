<template>
  <div class="report-generator-container">
    <div class="action-bar">
      <div class="bar-title">报告生成</div>
      <div class="bar-actions" style="display: flex; align-items: center; gap: 10px;">
        <input v-model.trim="searchText" type="text" class="keyword-input" placeholder="搜索委托单编号、报告编号或标题..."
          style="width: 240px;" />
        <button class="btn-primary" @click="openUploadModal">
          <i class="fa-solid fa-upload" style="margin-right: 4px;"></i> 报告来源
        </button>
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
            <th width="80">序号</th>
            <th width="150">委托单编号</th>
            <th width="150">报告编号</th>
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
            <td class="report-no">{{ item.entrustNo }}</td>
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

    <!-- 报告来源 综合弹窗 -->
    <div class="modal-overlay" v-if="showUploadModal" @click.self="closeUploadModal">
      <!-- 为了容纳表格，将弹窗宽度从 600px 改为了 800px -->
      <div class="modal-container upload-modal" style="width: 900px; max-width: 90%;">
        <div class="modal-header">
          <h3>报告来源</h3>
          <div class="header-actions">
            <button class="close-btn" @click="closeUploadModal">&times;</button>
          </div>
        </div>
        <div class="modal-body" style="padding: 24px;">

          <!-- 👇 新增工具栏容器：将 Tab 和 搜索框 放在同一行 👇 -->
          <div class="modal-toolbar">
            <div class="tab-switcher">
              <span :class="{ active: activeTab === 'select' }" @click="activeTab = 'select'">选择已有委托单</span>
              <span :class="{ active: activeTab === 'upload' }" @click="activeTab = 'upload'">上传本地资料</span>
            </div>

            <div class="search-wrap" v-show="activeTab === 'select'">
              <input v-model="orderSearchText" class="keyword-input" placeholder="搜索委托单编号、工程名称或单位..."
                style="width: 320px;" />
            </div>
          </div>

          <!-- 👇 模式一：选择委托单 (默认显示) 👇 -->
          <div v-show="activeTab === 'select'">
            <table class="order-select-table">
              <thead>
                <tr>
                  <th style="width: 150px;">委托单编号</th>
                  <th style="width: 150px;">工程名称</th>
                  <th style="width: 150px;">委托单位</th>
                  <th style="width: 80px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in filteredOrders" :key="order.id">
                  <td style="color: #2a3f7a; font-weight: bold;">{{ order.orderNo }}</td>
                  <td>{{ order.projectName }}</td>
                  <td>{{ order.clientName }}</td>
                  <td>
                    <button class="text-btn" @click="selectOrderForReport(order)" style="padding: 0;">生成</button>
                  </td>
                </tr>
                <tr v-if="filteredOrders.length === 0">
                  <td colspan="4" style="padding: 40px 0; text-align: center; color: #909399;">未搜索到相关委托单</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 👇 模式二：上传资料 (原有的逻辑保留在这里) 👇 -->
          <div v-show="activeTab === 'upload'">
            <!-- 技术方案上传 -->
            <div class="upload-item">
              <div class="upload-label">技术方案上传</div>
              <div class="upload-control">
                <button class="btn-select" @click="triggerTechFileInput">选择文件</button>
                <span class="file-name">{{ techFileName || '未选择任何文件' }}</span>
                <input type="file" ref="techFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display: none;"
                  @change="handleTechFileChange" />
              </div>
            </div>
            <!-- 委托单上传 -->
            <div class="upload-item">
              <div class="upload-label">委托单上传</div>
              <div class="upload-control">
                <button class="btn-select" @click="triggerEntrustFileInput">选择文件</button>
                <span class="file-name">{{ entrustFileName || '未选择任何文件' }}</span>
                <input type="file" ref="entrustFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx" style="display: none;"
                  @change="handleEntrustFileChange" />
              </div>
            </div>
            <!-- 电子原始记录上传 -->
            <div class="upload-item">
              <div class="upload-label">电子原始记录上传</div>
              <div class="upload-control">
                <button class="btn-select" @click="triggerOriginalFileInput">选择文件</button>
                <span class="file-name">{{ originalFileName || '未选择任何文件' }}</span>
                <input type="file" ref="originalFileInput" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  style="display: none;" @change="handleOriginalFileChange" />
              </div>
            </div>
          </div>



          <!-- 底部按钮：只有在上传模式时才需要确认按钮，因为在委托单表格里直接点击"生成"按钮就提交了 -->
          <div class="modal-footer" v-if="activeTab === 'upload'">
            <button class="btn-primary" @click="confirmUpload">确 认 生 成</button>
            <button class="btn-secondary" @click="closeUploadModal" style="margin-left: 10px;">取 消</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-overlay" v-if="showDetailModal" @click.self="closeModal">
      <div class="modal-container" :class="{ 'is-fullscreen': isFullscreen }" style="width: 900px; height: 90vh;">
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

        <div class="modal-body" style="padding: 0; background: #525659;">
          <iframe v-if="currentReport" :src="pdfPreviewUrl" width="100%" height="100%" frameborder="0"
            style="border: none; display: block; min-height: 500px;"></iframe>
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
    entrustNo: `WT-2026-${String(i).padStart(3, '0')}`,
    reportNo: `CTI-REP-2026${String(i).padStart(4, '0')}`,
    title: i % 2 !== 0 ? `AI智能检测生成报告 - 第${i}版` : `某建筑工地地基沉降监测方案 - 0${i}`,
    createTime: `2026-05-${String(Math.ceil(i / 3)).padStart(2, '0')} 14:20:00`,
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
    // 新增：匹配委托单编号
    (item.entrustNo && item.entrustNo.toLowerCase().includes(kw)) ||
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

// ================= 新增：报告来源弹窗的综合逻辑 =================

// 控制当前展示的是哪个页签，默认选委托单
const activeTab = ref('select');
const orderSearchText = ref('');

// 模拟的委托单数据源
const orderLibrary = ref([
  { id: 1, orderNo: 'WT-2026-001', projectName: '锦城绿道一期工程', clientName: '成都建工集团' },
  { id: 2, orderNo: 'WT-2026-002', projectName: '天府国际机场', clientName: '中建八局' },
  { id: 3, orderNo: 'WT-2026-003', projectName: '成都轨道交通18号线', clientName: '成都地铁公司' },
  { id: 4, orderNo: 'WT-2026-004', projectName: '华西医院扩建项目', clientName: '华西集团' },
  { id: 5, orderNo: 'WT-2026-005', projectName: '高新区V20地块', clientName: '高投集团' }
]);

const filteredOrders = computed(() => {
  if (!orderSearchText.value) return orderLibrary.value;
  const keyword = orderSearchText.value.toLowerCase();
  return orderLibrary.value.filter(o =>
    o.orderNo.toLowerCase().includes(keyword) ||
    o.projectName.toLowerCase().includes(keyword) ||
    o.clientName.toLowerCase().includes(keyword)
  );
});

// 在表格中直接点击“生成”
const selectOrderForReport = (order) => {
  alert(`已选择委托单 ${order.orderNo}！系统正在后台获取关联的技术方案与原始记录并生成报告...`);
  closeUploadModal();
};

// ⚠️ 注意：覆盖原本的 openUploadModal 函数，打开时重置状态
const openUploadModal = () => {
  activeTab.value = 'select'; // 每次打开弹窗，默认重置为“选择委托单”页签
  orderSearchText.value = ''; // 清空搜索框

  // 清空文件上传记录
  techFileName.value = '';
  entrustFileName.value = '';
  originalFileName.value = '';
  techFileObj.value = null;
  entrustFileObj.value = null;
  originalFileObj.value = null;
  showUploadModal.value = true;
};

</script>

<style scoped>
.report-generator-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);

}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 16px 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
}

.bar-title {
  font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important;
  font-size: 20px;
  font-weight: bold;
  color: #2a3f7a;
  /* 华测深蓝色 */
  border-left: 4px solid #2a3f7a;
  /* 左侧加粗竖条 */
  padding-left: 12px;
  line-height: 1.2;
  margin: 0;
  display: inline-block;
}

.btn-primary {
  background-color: #2a3f74;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background-color: #3e5a9e;
}

.table-wrapper {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.report-table th,
.report-table td {
  padding: 0px 12px;
  border-bottom: 1px solid #ebeef5;
}

.report-table th {
  color: #909399;
  font-weight: 500;
}

.report-table tbody tr:hover {
  background-color: #f5f7fa;
}

.empty-text {
  padding: 40px 0 !important;
  color: #909399;
}

.table-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.action-link {
  color: #2a3f74;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.action-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  font-size: 13px;
  color: #606266;
}

.total-text {
  margin-right: 15px;
}

.page-select {
  padding: 2px 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-right: 15px;
  color: #606266;
}

.pager-btns {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pager-arrow,
.pager-num {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  background-color: #f4f4f5;
  border-radius: 4px;
  cursor: pointer;
}

.pager-arrow.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.pager-num.active {
  background-color: #2a3f74;
  color: #fff;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.progress-container {
  background-color: #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  height: 6px;
  width: 60px;
}

.progress-bar {
  height: 100%;
  background-color: #2a3f74;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  width: 28px;
  text-align: right;
}

.status-tag {
  display: inline-block !important;
  /* 👇 核心修改：从 4px 8px 改为 2px 6px */
  padding: 2px 6px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-weight: normal !important;
  line-height: 1.2 !important;
}

.status-tag.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-container {
  background-color: #ffffff;
  width: 850px;
  max-width: 95%;
  height: 85vh;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.modal-container.is-fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: 100%;
  border-radius: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
  border-left: 4px solid #2a3f74;
  padding-left: 10px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #909399;
  cursor: pointer;
}

.icon-btn:hover {
  color: #2a3f74;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #909399;
  cursor: pointer;
}

.close-btn:hover {
  color: #f56c6c;
}

.modal-body {
  flex: 1;
  padding: 0;
  background-color: #525659;
  overflow: hidden;
  display: flex;
}

.modal-footer {
  padding: 12px 20px;
  background-color: #ffffff;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.download-btn {
  background-color: #2a3f74;
  color: #ffffff;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.download-btn:hover {
  background-color: #1d2c52;
}

/* ===== 新增的批量删除及复选框样式 ===== */
.btn-danger {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.3s;
}

.btn-danger:hover {
  background-color: #f78989;
}

.cb-wrap {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.cb-wrap input {
  display: none;
}

.cb-icon {
  width: 16px;
  height: 16px;
  border: 2px solid #dcdfe6;
  border-radius: 3px;
  display: inline-block;
  position: relative;
  transition: all 0.2s;
}

.cb-wrap input:checked+.cb-icon {
  background: #2a3f74;
  border-color: #2a3f74;
}

.cb-wrap input:checked+.cb-icon::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* ==========================================
   强制对齐第三模块的表格行间距与字号
   ========================================== */
.quotation-table th,
.quotation-table td,
.item-table th,
.item-table td {
  padding: 14px 12px !important;
  /* 👈 这里的 14px 是控制上下行间距的核心 */
  font-size: 13px !important;
  /* 👈 强制缩小到 13px，防止大字体把行距撑高 */
  line-height: 1.5 !important;
  /* 👈 统一文字的行高比例 */
  height: auto !important;
}

.quotation-table,
.item-table {
  font-size: 13px !important;
}

/* ==========================================
   强制终极覆盖：第7模块行间距与按钮高度压缩
   ========================================== */
.report-table th,
.report-table td {
  padding: 12px 12px !important;
  /* 强制缩小单元格内边距 */
  font-size: 13px !important;
  height: auto !important;
  /* 强制限制整行的高度 */
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
   弹窗 - 对齐第六模块设计风格
   ========================================== */
.modal-container.upload-modal {
  border-radius: 18px !important;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24) !important;
  background-color: #ffffff !important;
  overflow: hidden !important;
  height: auto !important;
  /* 👈 关键：高度由内容撑开 */
  max-height: 90vh !important;
  /* 👈 安全限制 */
  width: 700px !important;
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
  padding: 25px 26px 45px !important;
  overflow-y: auto !important;
}

/* 上传项布局 (对齐第六模块表单布局) */
.upload-item {
  display: flex;
  align-items: center !important;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #edf2f7;
  justify-content: center !important;
}

.upload-label {
  width: 280px !important;
  font-size: 14px;
  font-weight: 600;
  color: #2a3f7a;
  align-items: center !important;
  text-align: center !important;
}

.upload-control {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: right;
  /* 新增：让按钮和文件名水平居中 */
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

/* ==========================================
   报告来源：工具栏与美化版 Tab 切换器
   ========================================== */
.modal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

/* 强化版 Tab 容器底色：稍微加深的灰底，并增加一个极细的边框勾勒轮廓 */
.tab-switcher {
  display: inline-flex;
  background-color: #f0f2f5;
  padding: 3px;
  border-radius: 6px;
  border: 1px solid #e3e9f3;
}

/* 未选中时的默认样式 */
.tab-switcher span {
  padding: 3px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;
}

.tab-switcher span:hover {
  color: #2a3f7a;
}

/* 选中时的强高亮样式：实心深蓝底 + 纯白文字，彻底剥离混合感 */
.tab-switcher span.active {
  background-color: #2a3f7a !important;
  color: #ffffff !important;
  box-shadow: 0 2px 6px rgba(42, 63, 122, 0.25) !important;
}

/* ==========================================
   报告来源：委托单选择表格 (对齐原始记录全包围网格)
   ========================================== */
.order-select-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

}

.order-select-table th {
  background-color: #f3f6fb !important;
  padding: 6px 10px !important;
  text-align: center !important;
  border: 1px solid #edf2f7 !important;
  /* 全包围边框 */
  font-size: 13px !important;
  color: #2a3f7a !important;
  font-weight: bold !important;
}

.order-select-table td {
  padding: 12px 10px;
  text-align: center !important;
  border: 1px solid #edf2f7 !important;
  /* 全包围边框 */
  font-size: 13px !important;
  color: #334155 !important;
  word-break: break-all;
}

.order-select-table tbody tr:hover td {
  background-color: #f5f7fa !important;
}

.order-select-table button.text-btn {
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  color: #2a3f7a !important;
  background: transparent !important;
  border: none !important;
  padding: 0 4px !important;
  cursor: pointer !important;
  user-select: none !important;
}

.order-select-table button.text-btn:hover {
  text-decoration: underline !important;
  opacity: 0.8 !important;
}

/* 修改约 360 行起的上传项布局 */
.upload-item {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  /* 改为靠左排列，内部通过宽度控制间距 */
  margin-bottom: 24px !important;
  padding: 15px 20px !important;
  /* 增加内边距 */
  border-radius: 12px !important;
  /* 增加小圆角 */
  background: #f8fafd !important;
  /* 增加浅色背景背景，更有质感 */
  border: 1px solid #edf2f7 !important;
}

.upload-label {
  width: 180px !important;
  /* 宽度调小一点，避免占用过多空间 */
  font-size: 15px !important;
  font-weight: 700 !important;
  color: #2a3f7a !important;
  text-align: center !important;
  /* 👈 强制文字水平居中 */
  border-right: 2px solid #edf2f7 !important;
  /* 增加一个分割线效果 */
  margin-right: 20px !important;
}

.upload-control {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  gap: 15px !important;
  padding-left: 20px !important;
}

/* 优化选择文件按钮 */
.btn-select {
  background: #ffffff !important;
  border: 1px solid #2a3f7a !important;
  color: #2a3f7a !important;
  padding: 6px 15px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s !important;
}

.btn-select:hover {
  background: #2a3f7a !important;
  color: #ffffff !important;
}

.file-name {
  color: #64748b !important;
  font-size: 13px !important;
  font-style: italic !important;
  /* 未选择时斜体显示 */
}

.upload-item:first-child {
  margin-top: 20px !important;
}

/* 去除最后一个上传项底部的多余边距 */
.upload-item:last-child {
  margin-bottom: 0 !important;
}

.order-select-table:last-child {
  margin-bottom: 20px !important;
}
</style>