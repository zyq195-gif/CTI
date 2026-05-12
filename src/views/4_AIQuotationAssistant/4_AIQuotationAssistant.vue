<template>
  <div class="quotation-container">
    <div v-if="!showForm && !showDetail" class="list-view">
<div class="action-bar">
  <div class="bar-title">项目报价管理</div>
  <div class="bar-actions">
    <!-- 👇 新增：这里是你忘记添加的搜索框 HTML -->
    <input
      v-model.trim="searchText"
      type="text"
      class="keyword-input search-box"
      placeholder="搜索报价编号或标题..."
      style="width: 240px; margin-right: 10px;"
    />

    <button class="btn btn-primary" @click="handleAdd">
      <i class="fa-solid fa-plus"></i> 新增
    </button>
    <button class="btn btn-danger" @click="handleBatchDelete">
      <i class="fa-solid fa-trash" style="margin-right: 4px;"></i> 删除
    </button>
  </div>
</div>
      <div class="table-wrapper">
<table class="quotation-table">
          <thead>
            <tr>
              <th width="5%">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" v-model="isAllSelected">
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th width="6%">序号</th>
              <th width="18%">报价单编号</th>
              <th width="26%">标题</th>
              <th width="15%">报价金额</th>
              <th width="18%">创建时间</th>
              <th width="12%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in paginatedData" :key="item.id" :class="{ selected: selectedIds.includes(item.id) }">
              <td>
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" v-model="selectedIds" :value="item.id">
                  <span class="cb-icon"></span>
                </label>
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>
                <span class="quote-no">{{ item.quoteNo }}</span>
              </td>
              <td>{{ item.title || item.quoteNo }}</td>
              <td class="amount-col">¥{{ item.totalAmount }}</td>
              <td>{{ item.createTime }}</td>
              <td class="table-actions">
                <span class="action-link" @click="handleView(item)">查看</span>
                <span class="action-link" @click="handleEdit(item)">修改</span>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td colspan="7" class="empty-text">暂无报价单记录，点击"新增"创建</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" v-if="tableData.length > 0">
            <span class="total-text">共 {{ filteredData.length }} 条</span>
            <select class="page-select" v-model="pageSize" @change="handleSizeChange">
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="30">30条/页</option> </select>
          <div class="pager-btns">
            <span class="pager-arrow" :class="{ disabled: currentPage === 1 }" @click="prevPage">&lt;</span>
            <span class="pager-num active">{{ currentPage }}</span>
            <span class="pager-arrow" :class="{ disabled: currentPage === totalPages }" @click="nextPage">&gt;</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content form-modal">
        <div class="modal-header">
          <h3>{{ isView ? '查看报价单' : (isEdit ? '编辑报价单' : '新增报价单') }}</h3>
          <button class="btn-close" @click="closeForm">×</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <div class="sec-title"><span class="sec-num">一</span> 基本信息</div>
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label required">报价编号</label>
                <input class="form-input" v-model="form.quoteNo" placeholder="如：BJ-20260401-001" :readonly="isView">
              </div>
              <div class="form-item">
                <label class="form-label required">编制人</label>
                <input class="form-input" v-model="form.preparer" placeholder="请输入编制人" :readonly="isView">
              </div>
              <div class="form-item">
                <label class="form-label required">批准人</label>
                <input class="form-input" v-model="form.approver" placeholder="请输入批准人" :readonly="isView">
              </div>
              <div class="form-item">
                <label class="form-label">批准日期</label>
                <input class="form-input" type="date" v-model="form.approveDate" :readonly="isView">
              </div>
              <div class="form-item">
                <label class="form-label">报价日期</label>
                <input class="form-input" type="date" v-model="form.quoteDate" :readonly="isView">
              </div>
              <div class="form-item">
                <label class="form-label">联系人</label>
                <input class="form-input" v-model="form.contact" placeholder="公司联系人" :readonly="isView">
              </div>
              <div class="form-item">
                <label class="form-label">联系电话</label>
                <input class="form-input" v-model="form.phone" placeholder="公司联系电话" :readonly="isView">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="sec-title"><span class="sec-num">二</span> 检测项目明细</div>
            <div class="tbl-wrap">
              <table class="item-table">
          <thead>
            <tr>
              <th class="check-col">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" :checked="isAllSelected" @change="e => toggleSelectAll(e.target.checked)">
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th class="index-col">序号</th>
                    <th class="col-pname">检测项目</th>
                    <th class="col-price">单价(元/㎡)</th>
                    <th class="col-area">面积(㎡)</th>
                    <th class="col-total">合计(元)</th>
                    <th class="col-notes">备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in form.items" :key="idx">
                    <td class="col-seq">{{ idx + 1 }}</td>
                    <td class="col-pname">
                      <input v-if="item.editable" class="form-input" v-model="item.name" placeholder="自定义项目" :readonly="isView">
                      <span v-else>{{ item.name }}</span>
                    </td>
                    <td class="col-price">
                      <input v-if="item.editable" class="form-input price-input" type="number" v-model.number="item.unitPrice" :readonly="isView">
                      <span v-else>{{ item.unitPrice }}</span>
                    </td>
                    <td class="col-area">
                      <input v-if="!isView" class="form-input area-input" type="number" v-model.number="item.area" placeholder="0" min="0">
                      <span v-else>{{ item.area }}</span>
                    </td>
                    <td class="col-total">{{ calcItem(item) }}</td>
                    <td class="col-notes">
                      <span>{{ item.notes }}</span>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="4" class="total-label">合计金额</td>
                    <td class="total-amount">¥{{ formTotal }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeForm">取消</button>
          <button v-if="isView" class="btn btn-primary" @click="handleDownload">
            下载
          </button>
          <button v-else class="btn btn-primary" @click="handleSave" :disabled="saving">
            <i v-if="saving" class="fa-solid fa-spinner fa-spin"></i>
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetail" class="detail-view">
      <div class="detail-header">
        <button class="btn-back" @click="backToList">‹ 返回列表</button>
        <h3 class="detail-title">报价单详情</h3>
      </div>
      <div class="detail-body">
        <div class="detail-card">
          <h4 class="card-title">上传报价单</h4>
          <div class="upload-zone" @click="triggerUpload" @dragover.prevent @drop.prevent="handleDrop">
            <input type="file" ref="uploadRef" class="file-hide" @change="handleFileChange" accept=".doc,.docx">
            <div class="upload-inner">
              <div class="upload-icon">📄</div>
              <p class="upload-text">点击或拖拽上传报价单</p>
              <p class="upload-hint">支持 .doc / .docx 格式</p>
            </div>
          </div>
          <div v-if="currentItem.fileName" class="file-info">
            <span class="file-name">{{ currentItem.fileName }}</span>
            <button class="btn-link" @click="downloadFile">下载</button>
          </div>
        </div>

        <div class="detail-card">
          <h4 class="card-title">报价单详情查看与下载</h4>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">报价编号：</span>
              <span class="info-val">{{ currentItem.quoteNo }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">编制人：</span>
              <span class="info-val">{{ currentItem.preparer }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">报价金额：</span>
              <span class="info-val amount">¥{{ currentItem.totalAmount }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">创建时间：</span>
              <span class="info-val">{{ currentItem.createTime }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" @click="downloadQuote">
              <i class="fa-solid fa-download"></i> 下载报价单
            </button>
          </div>
        </div>

        <div class="detail-card">
          <h4 class="card-title">重新上传报价单</h4>
          <div class="upload-zone" @click="triggerReupload" @dragover.prevent @drop.prevent="handleReDrop">
            <input type="file" ref="reuploadRef" class="file-hide" @change="handleReuploadChange" accept=".doc,.docx">
            <div class="upload-inner">
              <div class="upload-icon">🔄</div>
              <p class="upload-text">点击或拖拽重新上传</p>
              <p class="upload-hint">将覆盖原有文件</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="saving" class="loading-overlay">
      <div class="loading-box">
        <div class="spinner"></div>
        <p>正在保存，请稍候...</p>
      </div>
    </div>

    <div class="preview-modal-overlay" v-if="showPreviewModal" @click.self="closePreviewModal">
      <div class="preview-modal-container" :class="{ 'is-fullscreen': isPreviewFullscreen }">
        <div class="preview-modal-header">
          <h3>报价单详情 - {{ currentPreviewItem?.quoteNo }}</h3>
          <div class="preview-header-actions">
            <button class="preview-icon-btn" @click="togglePreviewFullscreen" :title="isPreviewFullscreen ? '还原' : '最大化'">
              <i :class="isPreviewFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
            </button>
            <button class="preview-close-btn" @click="closePreviewModal" title="关闭">
              &times;
            </button>
          </div>
        </div>
        <div class="preview-modal-body">
          <iframe
            v-if="currentPreviewItem"
            :src="previewUrl"
            width="100%"
            height="100%"
            frameborder="0"
            style="border: none; display: block; background-color: #525659;"
          ></iframe>
        </div>
        <div class="preview-modal-footer">
          <button class="btn btn-primary" @click="downloadPreviewQuote">
            <i class="fa-solid fa-download" style="margin-right: 5px;"></i> 下载报价单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

defineOptions({ name: 'AIQuotationAssistant' })

// ===== 列表数据 =====
// 1. 提取出基础的项目明细模板
const defaultMockItems = [
  { name: '简易房屋', unitPrice: 12, area: 0, notes: '', editable: false },
  { name: '普通住宅', unitPrice: 15, area: 0, notes: '', editable: false },
  { name: '医疗办公及教科研建筑', unitPrice: 17, area: 0, notes: '', editable: false },
  { name: '商业与服务业建筑', unitPrice: 20, area: 0, notes: '', editable: false },
  { name: '旅游与文保建筑', unitPrice: 32, area: 0, notes: '', editable: false },
  { name: '文体交通建筑', unitPrice: 23, area: 0, notes: '', editable: false },
  { name: '综合类及特殊建筑', unitPrice: 27, area: 0, notes: '', editable: false },
  { name: '单层制造业厂房', unitPrice: 18, area: 0, notes: '', editable: false },
  { name: '生产辅助厂房', unitPrice: 15, area: 0, notes: '', editable: false },
  { name: '仓储建筑', unitPrice: 16, area: 0, notes: '', editable: false },
  { name: '多层轻工业厂房', unitPrice: 19, area: 0, notes: '', editable: false },
  { name: '动力厂房', unitPrice: 20, area: 0, notes: '', editable: false },
  { name: '其他工业建筑', unitPrice: 25, area: 0, notes: '', editable: false },
  { name: '其他民用建筑', unitPrice: 20, area: 0, notes: '', editable: false },
  { name: '', unitPrice: 0, area: 0, notes: '', editable: true },
]

// 2. 循环生成 15 条记录
const mockDataList = []
for (let i = 1; i <= 15; i++) {
  // 深度拷贝一份明细
  const items = JSON.parse(JSON.stringify(defaultMockItems))
  // 动态赋个随机面积让总金额看起来不一样
  items[0].area = 500 + i * 100
  items[1].area = i % 2 === 0 ? 300 : 0

  // 计算这单的总金额
  const total = items.reduce((sum, item) => sum + (item.unitPrice * item.area), 0)

  mockDataList.push({
    id: i,
    quoteNo: `BJ-202604${String(i).padStart(2, '0')}-00${i}`,
    title: `工程结构检测报价 - 0${i}期`,
    createTime: `2026-04-${String(i).padStart(2, '0')} 10:30:00`,
    totalAmount: total.toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    preparer: '华测工程师',
    approver: '审核员',
    approveDate: `2026-04-${String(i).padStart(2, '0')}`,
    quoteDate: `2026-04-${String(i).padStart(2, '0')}`,
    contact: '王经理',
    phone: '13800138000',
    items: items,
    fileName: ''
  })
}

// 3. 赋值给 tableData
const tableData = ref(mockDataList)

const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref([])
const showForm = ref(false)
const showDetail = ref(false)
const isEdit = ref(false)
const isView = ref(false) // 查看模式
const editingId = ref(null) // 跟踪正在编辑的ID
const saving = ref(false)
const currentItem = ref({})
const uploadRef = ref(null)
const reuploadRef = ref(null)

// ===== 预览弹窗 =====
const showPreviewModal = ref(false)
const isPreviewFullscreen = ref(false)
const currentPreviewItem = ref(null)
const previewUrl = ref('')

// 全选计算属性
const isAllSelected = computed({
  get: () => paginatedData.value.length > 0 && paginatedData.value.every(i => selectedIds.value.includes(i.id)),
  set: (value) => {
    selectedIds.value = value ? paginatedData.value.map(i => i.id) : []
  }
})

// ===== 表单数据 =====
const getDefaultForm = () => ({
  quoteNo: '',
  preparer: '',
  approver: '',
  approveDate: '',
  quoteDate: '',
  contact: '',
  phone: '',
  items: [
    { name: '简易房屋',           unitPrice: 12, area: 0, notes: '简易平房、仓库、自行车棚等', editable: false },
    { name: '普通住宅',           unitPrice: 15, area: 0, notes: '普通商品房、保障房、房改房、旧式砖木楼房、小式民居、老旧民房等', editable: false },
    { name: '医疗办公及教科研建筑', unitPrice: 17, area: 0, notes: '办公楼、医院、康复中心，托儿所、幼儿园、中小学校、高等院校、实验楼、科研楼等', editable: false },
    { name: '商业与服务业建筑',   unitPrice: 20, area: 0, notes: '商场、超市、百货公司、银行、饮食店、餐馆、洗浴中心、美容中心等', editable: false },
    { name: '旅游与文保建筑',     unitPrice: 32, area: 0, notes: '度假村、游乐场、会议中心、宾馆、会所，动物园、纪念碑、纪念馆、文物古建筑等', editable: false },
    { name: '文体交通建筑',        unitPrice: 23, area: 0, notes: '剧院、电影院、图书馆、博物馆、档案馆、文化馆、展览馆，体育场、体育馆、游泳馆等', editable: false },
    { name: '综合类及特殊建筑',   unitPrice: 27, area: 0, notes: '多功能综合大楼、现代化写字楼、商住楼，加油站、燃气站、消防站等', editable: false },
    { name: '单层制造业厂房',     unitPrice: 18, area: 0, notes: '', editable: false },
    { name: '生产辅助厂房',        unitPrice: 15, area: 0, notes: '', editable: false },
    { name: '仓储建筑',            unitPrice: 16, area: 0, notes: '', editable: false },
    { name: '多层轻工业厂房',     unitPrice: 19, area: 0, notes: '', editable: false },
    { name: '动力厂房',            unitPrice: 20, area: 0, notes: '', editable: false },
    { name: '其他工业建筑',       unitPrice: 25, area: 0, notes: '', editable: false },
    { name: '其他民用建筑',       unitPrice: 20, area: 0, notes: '', editable: false },
    { name: '',                    unitPrice: 0,  area: 0, notes: '', editable: true },
  ]
})
const form = ref(getDefaultForm())

// ===== 计算属性 =====
const searchText = ref('')

// 1. 新增：根据搜索词过滤后的数据列表
const filteredData = computed(() => {
  if (!searchText.value) return tableData.value
  const keyword = searchText.value.toLowerCase()
  return tableData.value.filter(item =>
    (item.quoteNo && item.quoteNo.toLowerCase().includes(keyword)) ||
    (item.title && item.title.toLowerCase().includes(keyword))
  )
})

// 2. 修改：基于过滤后的数据计算总页数
const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value) || 1)

// 3. 修改：基于过滤后的数据进行分页切割
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

// 4. 新增：当搜索词变化时，自动重置回第一页
watch(searchText, () => {
  currentPage.value = 1
})
const calcItem = (item) => {
  const t = (item.unitPrice || 0) * (item.area || 0)
  return t ? t.toFixed(2) : '0.00'
}
const formTotal = computed(() => {
  return form.value.items.reduce((s, i) => s + (i.unitPrice || 0) * (i.area || 0), 0).toFixed(2)
})

const handleAdd = () => {
  isEdit.value = false
  form.value = getDefaultForm()
  showForm.value = true
}

// ===== 纯前端预览弹窗方法 =====
const handleView = (row) => {
  currentPreviewItem.value = { ...row }
  showPreviewModal.value = true
  isPreviewFullscreen.value = false
  // 直接指向 public/huace 目录下的 PDF 模板
  previewUrl.value = encodeURI(`${import.meta.env.BASE_URL}4.报价单模板.pdf`)
}

// 修改报价单
const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  const item = tableData.value.find(i => i.id === row.id)
  if (item) {
    const defaultItems = getDefaultForm().items.map(i => ({...i}))
    // 合并保存的面积数据到默认项目
    if (item.items) {
      item.items.forEach(saved => {
        const match = defaultItems.find(d => d.name === saved.name)
        if (match) match.area = saved.area
      })
    }
    form.value = {
      ...getDefaultForm(),
      quoteNo: item.quoteNo,
      preparer: item.preparer || '',
      approver: item.approver || '',
      approveDate: item.approveDate || '',
      quoteDate: item.quoteDate || '',
      contact: item.contact || '',
      phone: item.phone || '',
      items: defaultItems,
    }
  }
  showForm.value = true
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return alert('请先选择要删除的项')
  if (confirm(`确定删除选中的 ${selectedIds.value.length} 项？`)) {
    tableData.value = tableData.value.filter(i => !selectedIds.value.includes(i.id))
    selectedIds.value = []
  }
}

const handleDelete = (index) => {
  if (confirm('确定要删除这条记录吗？')) {
    tableData.value.splice(index, 1)
    alert('删除成功')
  }
}

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const handleSizeChange = () => { currentPage.value = 1 }

// ===== 纯前端下载逻辑 =====
const handleDownload = () => {
  const fileName = '4.报价单模板.docx'
  const link = document.createElement('a')
  link.href = encodeURI(`${import.meta.env.BASE_URL}${fileName}`)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const downloadPreviewQuote = () => {
  const fileName = '4.报价单模板.docx'
  const link = document.createElement('a')
  link.href = encodeURI(`${import.meta.env.BASE_URL}${fileName}`)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const closePreviewModal = () => {
  showPreviewModal.value = false
  isPreviewFullscreen.value = false
  currentPreviewItem.value = null
  previewUrl.value = ''
}

const togglePreviewFullscreen = () => {
  isPreviewFullscreen.value = !isPreviewFullscreen.value
}

// ===== 保存 =====
const handleSave = () => {
  if (!form.value.quoteNo.trim()) return alert('请填写报价编号')
  if (!form.value.preparer.trim()) return alert('请填写编制人')
  if (!form.value.approver.trim()) return alert('请填写批准人')

  saving.value = true
  setTimeout(() => {
    const total = Number(formTotal.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
    if (editingId.value) {
      // 编辑模式：更新现有记录
      const index = tableData.value.findIndex(i => i.id === editingId.value)
      if (index !== -1) {
        tableData.value[index] = {
          ...tableData.value[index],
          quoteNo: form.value.quoteNo,
          title: form.value.quoteNo + ' 报价单',
          preparer: form.value.preparer,
          approver: form.value.approver,
          approveDate: form.value.approveDate,
          quoteDate: form.value.quoteDate,
          contact: form.value.contact,
          phone: form.value.phone,
          items: form.value.items.map(item => ({...item})), // 保存项目明细
          totalAmount: total,
        }
      }
      editingId.value = null
      alert('修改成功！')
    } else {
      // 新增模式：添加新记录
      const newId = Math.max(0, ...tableData.value.map(i => i.id)) + 1
      tableData.value.unshift({
        id:        newId,
        quoteNo:   form.value.quoteNo,
        title:     form.value.quoteNo + ' 报价单',
        createTime: new Date().toLocaleString(),
        totalAmount: total,
        preparer:  form.value.preparer,
        approver:  form.value.approver,
        approveDate: form.value.approveDate,
        quoteDate: form.value.quoteDate,
        contact:   form.value.contact,
        phone:     form.value.phone,
        items:     form.value.items.map(item => ({...item})), // 保存项目明细
        fileName:   ''
      })
      alert('保存成功！')
    }
    saving.value = false
    closeForm()
  }, 800)
}

const closeForm = () => {
  showForm.value = false
  editingId.value = null
  isView.value = false
  form.value = getDefaultForm()
}

const backToList = () => {
  showDetail.value = false
}

// ===== 文件上传 =====
const triggerUpload = () => uploadRef.value?.click()
const triggerReupload = () => reuploadRef.value?.click()

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) handleUploadFile(file)
}
const handleDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) handleUploadFile(file)
}
const handleReDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) handleUploadFile(file)
}
const handleReuploadChange = (e) => {
  const file = e.target.files[0]
  if (file) handleUploadFile(file)
}

const handleUploadFile = (file) => {
  if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
    return alert('请上传 Word 文档(.doc/.docx)')
  }
  currentItem.value.fileName = file.name
  alert('上传成功：' + file.name)
}

const downloadFile = () => {
  alert('下载文件：' + currentItem.value.fileName)
}

const downloadQuote = () => {
  handleDownload()
}
</script>

<style scoped>
.quotation-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* ===== 顶部操作栏 ===== */
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
  color: #2a3f7a; /* 华测深蓝色 */
  border-left: 4px solid #2a3f7a; /* 左侧加粗竖条 */
  padding-left: 12px;
  line-height: 1.2;
  margin: 0;
  display: inline-block;
}

.bar-actions { display: flex; gap: 10px; }

.bar-actions .btn {
  width: 104px;
}

/* 按钮 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center; /* 确保文字和图标始终居中 */
  gap: 6px;

  /* 【核心对齐】：强制锁定“上下高度（厚度）”为 32px，完美复刻 Element Plus */
  height: 32px;
  padding: 0 15px;
  box-sizing: border-box; /* 防止边框撑大按钮 */

  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  font-family: inherit;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-primary { background: #2a3f7a; color: #fff; border-color: #2a3f7a; }
.btn-primary:hover:not(:disabled) { background: #3e5a9e; }
/* 彻底对齐 Element Plus 的 Danger 按钮色系 */
.btn-danger { background: #f56c6c; color: #fff; border-color: #f56c6c; }
.btn-danger:hover:not(:disabled) { background: #f89898; border-color: #f89898; }
.btn-danger:active:not(:disabled) { background: #dd6161; border-color: #dd6161; }
.btn-default { background: #fff; color: #606266; border-color: #dcdfe6; }
.btn-default:hover { color: #2a3f7a; border-color: #2a3f7a; }

/* ===== 表格区域 ===== */
.table-wrapper {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}
.quotation-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 14px;
  color: #606266;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.quotation-table th,
.quotation-table td {
  padding: 14px 10px;
  border-bottom: 1px solid #ebeef5;
}
.quotation-table th { color: #909399; font-weight: 500; }
.quotation-table tbody tr:hover { background-color: #f5f7fa; }
.quotation-table tbody tr.selected { background-color: #ecf5ff; }
/* 1. 报价单编号：加粗 + 华测深蓝 */
.quote-no {
  color: #2a3f7a !important;     /* 华测蓝 */
  font-weight: 700 !important;   /* 字体加粗 */
  font-size: 13px !important;    /* 统一表格字号 */
}

/* 2. 报价金额：加粗 + 红色 */
.amount-col {
  color: #f56c6c !important;     /* 醒目红色 */
  font-weight: 700 !important;   /* 字体加粗 */
}

.empty-text { text-align: center; padding: 40px 0 !important; color: #909399; }

/* 复选框 */
.cb-wrap { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: #606266; user-select: none; }
.cb-wrap input { display: none; }
.cb-icon { width: 16px; height: 16px; border: 2px solid #dcdfe6; border-radius: 3px; display: inline-block; transition: all 0.2s; position: relative; }
.cb-wrap input:checked + .cb-icon { background: #2a3f7a; border-color: #2a3f7a; }
.cb-wrap input:checked + .cb-icon::after {
  content: ''; position: absolute; left: 4px; top: 1px;
  width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg);
}

/* 操作链接 */
.table-actions { display: flex; justify-content: center; gap: 15px; }
.action-link { color: #2a3f7a; cursor: pointer; font-size: 14px; user-select: none; }
.action-link:hover { opacity: 0.8; text-decoration: underline; }
.action-link.delete { color: #f56c6c; }

/* ===== 分页 ===== */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  font-size: 13px;
  color: #606266;
}
.total-text { margin-right: 15px; }
.page-select { padding: 2px 5px; border: 1px solid #dcdfe6; border-radius: 4px; margin-right: 15px; color: #606266; }
.pager-btns { display: flex; align-items: center; gap: 5px; }
.pager-arrow, .pager-num {
  display: inline-flex; justify-content: center; align-items: center;
  width: 28px; height: 28px; background-color: #f4f4f5; border-radius: 4px; cursor: pointer;
  font-size: 13px; color: #606266;
}
.pager-arrow.disabled { color: #c0c4cc; cursor: not-allowed; }
.pager-num.active { background-color: #2a3f7a; color: #fff; }

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-content { background: #fff; border-radius: 8px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
.form-modal { width: 900px; max-width: 95vw; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #ebeef5;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2a3f7a;
  /* 【新增】：添加深蓝色竖条样式 */
  border-left: 4px solid #2a3f7a;
  padding-left: 10px;
  line-height: 1.1;
  font-weight: 600;
}
.btn-close { background: none; border: none; font-size: 20px; color: #909399; cursor: pointer; }
.modal-body { padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #ebeef5; }

/* 表单 */
.form-section { display: flex; flex-direction: column; gap: 16px; }
.sec-title { font-size: 15px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 8px; }
.sec-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; background: #2a3f7a; color: #fff;
  border-radius: 50%; font-size: 12px; font-weight: 700;
}
.form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.form-item { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; color: #606266; }
.form-label.required::before { content: '*'; color: #f56c6c; margin-right: 4px; }
.form-input {
  padding: 8px 12px; font-size: 13px;
  border: 1px solid #dcdfe6; border-radius: 4px; outline: none; font-family: inherit;
}
.form-input:focus { border-color: #2a3f7a; }

/* 项目表格 */
.tbl-wrap { overflow-x: auto; }
.item-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.item-table th {
  background: #f8fafc; color: #64748b; font-weight: 500;
  padding: 10px 8px; border-bottom: 1px solid #ebeef5; text-align: center;
}
.item-table td { padding: 8px; border-bottom: 1px solid #ebeef5; text-align: center; color: #606266; }
.item-table tfoot td { padding: 12px 8px; font-weight: 700; background: #f8fafc; }
.total-label { text-align: right; color: #2a3f7a; }
.total-amount { color: #f56c6c; font-size: 15px; }

/* 项目表格列宽 */
.col-seq { width: 50px; }
.col-pname { width: 20%; text-align: left; }
.col-price { width: 100px; }
.col-area { width: 100px; }
.col-total { width: 100px; }
.col-notes { width: 15%; }

/* 输入框样式 */
.price-input, .area-input { width: 80px; text-align: center; }
.notes-input { width: 100%; min-width: 100px; }

/* ===== 详情视图 ===== */
.detail-view { display: flex; flex-direction: column; gap: 20px; }
.detail-header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid #ebeef5; }
.btn-back { background: none; border: none; color: #2a3f7a; cursor: pointer; font-size: 14px; padding: 6px 12px; border-radius: 4px; }
.btn-back:hover { background: #f5f7fa; }
.detail-title { font-size: 18px; color: #1e293b; margin: 0; }

.detail-body { display: flex; flex-direction: column; gap: 20px; }
.detail-card { background: #fff; border-radius: 8px; border: 1px solid #ebeef5; padding: 24px; }
.card-title { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0; padding-left: 10px; border-left: 3px solid #2a3f7a; }

/* 上传 */
.upload-zone { border: 2px dashed #dcdfe6; border-radius: 8px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; }
.upload-zone:hover { border-color: #2a3f7a; background: #f8fafc; }
.file-hide { display: none; }
.upload-icon { font-size: 40px; margin-bottom: 12px; }
.upload-text { font-size: 14px; color: #606266; margin: 0 0 6px 0; }
.upload-hint { font-size: 12px; color: #909399; margin: 0; }
.file-info { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; }
.file-name { font-size: 13px; color: #606266; }
.btn-link { background: none; border: none; color: #2a3f7a; cursor: pointer; font-size: 13px; }
.btn-link:hover { text-decoration: underline; }

/* 信息列表 */
.info-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.info-row { display: flex; gap: 8px; }
.info-label { width: 100px; color: #64748b; font-size: 14px; flex-shrink: 0; }
.info-val { color: #1e293b; font-size: 14px; }
.info-val.amount { color: #f56c6c; font-weight: 600; font-size: 16px; }
.card-actions { display: flex; justify-content: center; }

/* ===== 加载遮罩 ===== */
.loading-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
  z-index: 2000;
}
.loading-box {
  background: #fff; border-radius: 12px; padding: 40px 60px; text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}
.spinner {
  width: 40px; height: 40px; margin: 0 auto 16px;
  border: 4px solid #ebeef5; border-top-color: #2a3f7a; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-box p { margin: 0; font-size: 14px; color: #606266; }

/* ===== 纯前端预览弹窗 ===== */
.preview-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); display: flex;
  justify-content: center; align-items: center; z-index: 2000;
}
.preview-modal-container {
  background-color: #ffffff; width: 850px; max-width: 95%;
  height: 85vh; border-radius: 6px; display: flex; flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15); overflow: hidden;
  transition: all 0.3s ease;
}
.preview-modal-container.is-fullscreen {
  width: 100vw; height: 100vh; max-width: 100%; border-radius: 0;
}
.preview-modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background-color: #f8f9fa; border-bottom: 1px solid #ebeef5;
}
.preview-modal-header h3 {
  margin: 0; font-size: 18px; color: #1e293b;
  border-left: 4px solid #2a3f7a; padding-left: 10px; font-weight: 600;
}
.preview-header-actions { display: flex; align-items: center; gap: 16px; }
.preview-icon-btn {
  background: none; border: none; font-size: 18px; color: #909399;
  cursor: pointer; line-height: 1; transition: color 0.2s; padding: 0;
  display: flex; align-items: center; justify-content: center;
}
.preview-icon-btn:hover { color: #2a3f7a; }
.preview-close-btn {
  background: none; border: none; font-size: 28px; color: #909399;
  cursor: pointer; line-height: 1; transition: color 0.2s; padding: 0;
}
.preview-close-btn:hover { color: #f56c6c; }
.preview-modal-body {
  flex: 1; padding: 0; background-color: #e8e8e8; overflow: hidden; display: flex;
}
.preview-modal-footer {
  padding: 12px 20px; background-color: #ffffff;
  border-top: 1px solid #ebeef5; display: flex; justify-content: flex-end;
}
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
</style>