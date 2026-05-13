<template>
  <div class="digital-record-page">
    <div class="record-main-container">
      <div class="action-bar">
        <div class="bar-title">电子原始记录</div>

        <div class="bar-actions">
          <input v-model="searchText" class="keyword-input" placeholder="搜索委托单编号、记录名称、编号或工程名称..."
            style="width: 280px;" />
          <button class="btn btn-primary" @click="openAddModal">
            <i class="fa-solid fa-plus"></i> 新增
          </button>
          <button class="btn btn-danger" @click="handleBatchDelete">
            <i class="fa-solid fa-trash" style="margin-right: 4px;"></i> 删除
          </button>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="table-wrap list-table">
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" v-model="isAllSelected">
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th style="width: 60px;">序号</th>
              <th style="width: 140px;">委托单编号</th>
              <th style="width: 160px;">记录编号</th>
              <th style="width: 180px;">记录名称</th>
              <th style="width: 230px;">工程名称</th>
              <th style="width: 160px;">创建时间</th>
              <th style="width: 120px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in paginatedRecords" :key="record.id">
              <td>
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" v-model="selectedIds" :value="record.id">
                  <span class="cb-icon"></span>
                </label>
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td class="order-no-text">{{ record.orderNo || '--' }}</td>
              <td class="code-text">{{ record.recordNo }}</td>
              <td class="bold-text">{{ record.recordName }}</td>
              <td>{{ record.projectName }}</td>
              <td>{{ record.createDate }}</td>
              <td>
                <button class="text-btn" @click="viewRecordDetail(record)">查看</button>
                <button class="text-btn" @click="editRecord(record)">修改</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="filteredRecords.length > 0">
        <span class="total-text">共 {{ filteredRecords.length }} 条</span>
        <select class="page-select" v-model="pageSize" @change="currentPage = 1">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="30">30条/页</option>
        </select>
        <div class="pager-btns">
          <span class="pager-arrow" :class="{ disabled: currentPage === 1 }" @click="currentPage > 1 && currentPage--">
            &lt;
          </span>
          <span class="pager-num active">{{ currentPage }}</span>
          <span class="pager-arrow" :class="{ disabled: currentPage === totalPages }"
            @click="currentPage < totalPages && currentPage++">&gt;</span>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="modal-mask">
      <div class="modal-box detail-modal">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">柱参数检测记录详情</h3>
            <p class="modal-subtitle">记录编号：{{ activeRecord?.recordNo }}</p>
          </div>

          <div class="modal-header-actions">
            <button class="light-btn" @click="exportRecord(activeRecord)">导出记录</button>
            <button class="close-btn-icon" @click="showDetailModal = false">×</button>
          </div>
        </div>

        <div class="modal-content fixed-content">
          <div class="basic-info-table">
            <div class="basic-row two-col">
              <div class="basic-cell">
                <span>委托单编号</span>
                <strong>{{ activeRecord?.orderNo || '--' }}</strong>
              </div>
              <div class="basic-cell">
                <span>样品编号</span>
                <strong>{{ activeRecord?.sampleNo }}</strong>
              </div>
            </div>

            <div class="basic-row two-col">
              <div class="basic-cell">
                <span>检测日期</span>
                <strong>{{ activeRecord?.checkDate }}</strong>
              </div>
              <div class="basic-cell">
                <span>记录编号</span>
                <strong>{{ activeRecord?.recordNo }}</strong>
                <span>仪器设备</span>
                <strong>{{ formatArray(activeRecord?.instrument) }}</strong>
              </div>
            </div>

            <div class="basic-row">
              <div class="basic-cell full-span">
                <span>检测依据</span>
                <strong>{{ formatArray(activeRecord?.basis) }}</strong>
              </div>
            </div>
          </div>

          <div class="detail-table-scroll">
            <table class="hierarchical-table detail-view-table">
              <thead>
                <tr>
                  <th rowspan="2" style="width: 60px;">序号</th>
                  <th rowspan="2" style="width: 210px;">检测部位及构件名称</th>
                  <th rowspan="2" style="width: 130px;">测点轴线位置</th>
                  <th colspan="2">构件截面(mm)</th>
                  <th rowspan="2" style="width: 110px;">砼设计等级</th>
                  <th rowspan="2" style="width: 110px;">实测碳化</th>
                  <th rowspan="2" style="width: 120px;">构件编号</th>
                  <th colspan="3">钢筋设计要求</th>
                  <th rowspan="2" style="width: 120px;">扫描方向</th>
                  <th rowspan="2" style="width: 210px;">钢筋保护层厚度<br />检测数据(mm)</th>
                  <th rowspan="2" style="width: 210px;">钢筋间距<br />检测数据(mm)</th>
                  <th rowspan="2" style="width: 160px;">备注</th>
                </tr>

                <tr>
                  <th style="width: 110px;">实测值</th>
                  <th style="width: 110px;">平均值</th>
                  <th style="width: 110px;">规格</th>
                  <th style="width: 110px;">间距</th>
                  <th style="width: 130px;">保护层厚度</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(row, index) in activeRecordRows" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.part }}</td>
                  <td>{{ row.axis }}</td>
                  <td>{{ row.secMeasured }}</td>
                  <td>{{ row.secAvg }}</td>
                  <td>{{ row.concreteGrade }}</td>
                  <td>{{ row.carb }}</td>
                  <td>{{ row.compNo }}</td>
                  <td>{{ row.steelSpec }}</td>
                  <td>{{ row.spacingDesign }}</td>
                  <td>{{ row.coverDesign }}</td>
                  <td>{{ row.scanDir }}</td>
                  <td>{{ row.coverData }}</td>
                  <td>{{ row.spacingData }}</td>
                  <td>{{ row.remark }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-mask">
      <div class="modal-box add-modal">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">
              {{ modalMode === 'add' ? '新增电子原始记录' : '修改电子原始记录' }}
            </h3>
          </div>

          <button class="close-btn-icon" @click="closeAddModal">×</button>
        </div>

        <div class="modal-content scroll-content">
          <div class="form-section">
            <h4 class="section-title">基础信息</h4>

            <div class="form-grid">
              <label>
                <span>委托单编号</span>
                <div class="input-with-btn">
                  <input v-model="form.orderNo" placeholder="请选择委托单" readonly
                    style="color: #2a3f7a; font-weight: bold; cursor: pointer; background: #f3f6fb;"
                    @click="openOrderSelector" />
                  <button class="primary-btn select-btn" type="button" @click="openOrderSelector">选择</button>
                </div>
              </label>
              <label>
                <span>记录编号</span>
                <input v-model="form.recordNo" placeholder="请输入记录编号" />
              </label>

              <label>
                <span>记录名称</span>
                <input v-model="form.recordName" placeholder="请输入记录名称" />
              </label>

              <label>
                <span>样品编号</span>
                <input v-model="form.sampleNo" placeholder="请输入样品编号" />
              </label>

              <label>
                <span>检测日期</span>
                <input v-model="form.checkDate" type="date" />
              </label>

              <label class="full-width">
                <span>仪器设备</span>
                <el-select v-model="form.instrument" multiple class="plain-text-select" placeholder="请选择仪器设备..."
                  style="width: 100%; margin-top: 4px;">
                  <el-option label="混凝土回弹仪(HT-225型)" value="混凝土回弹仪(HT-225型)" />
                  <el-option label="碳化深度检测仪(HD-TH2)" value="碳化深度检测仪(HD-TH2)" />
                  <el-option label="钢筋扫描仪(ZBL-R630A)" value="钢筋扫描仪(ZBL-R630A)" />
                  <el-option label="卷尺(5m)" value="卷尺(5m)" />
                </el-select>
              </label>

              <label class="full-width">
                <span>检测依据</span>
                <el-select v-model="form.basis" multiple class="plain-text-select" placeholder="请选择检测依据..."
                  style="width: 100%; margin-top: 4px;">
                  <el-option label="GB 50204-2015《混凝土结构工程施工质量验收规范》" value="GB 50204-2015《混凝土结构工程施工质量验收规范》" />
                  <el-option label="JGJ/T 23-2011《回弹法检测混凝土抗压强度技术规程》" value="JGJ/T 23-2011《回弹法检测混凝土抗压强度技术规程》" />
                  <el-option label="JGJ/T 152-2019《混凝土中钢筋检测技术标准》" value="JGJ/T 152-2019《混凝土中钢筋检测技术标准》" />
                  <el-option label="JGJ/T 294-2013《高强混凝土强度检测技术规程》" value="JGJ/T 294-2013《高强混凝土强度检测技术规程》" />
                </el-select>
              </label>
            </div>
          </div>
          <div class="form-section">
            <div class="section-row">
              <h4 class="section-title">检测数据明细</h4>
              <button class="primary-btn" @click="addRow">+ 新增检测行</button>
            </div>

            <div class="edit-table-wrap">
              <table class="hierarchical-table edit-table">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 60px;">序号</th>
                    <th rowspan="2" style="width: 210px;">检测部位及构件名称</th>
                    <th rowspan="2" style="width: 130px;">测点轴线位置</th>
                    <th colspan="2">构件截面(mm)</th>
                    <th rowspan="2" style="width: 110px;">砼设计等级</th>
                    <th rowspan="2" style="width: 110px;">实测碳化</th>
                    <th rowspan="2" style="width: 120px;">构件编号</th>
                    <th colspan="3">钢筋设计要求</th>
                    <th rowspan="2" style="width: 120px;">扫描方向</th>
                    <th rowspan="2" style="width: 210px;">钢筋保护层厚度<br />检测数据(mm)</th>
                    <th rowspan="2" style="width: 210px;">钢筋间距<br />检测数据(mm)</th>
                    <th rowspan="2" style="width: 160px;">备注</th>
                    <th rowspan="2" style="width: 90px;" class="sticky-action">操作</th>
                  </tr>

                  <tr>
                    <th style="width: 110px;">实测值</th>
                    <th style="width: 110px;">平均值</th>
                    <th style="width: 110px;">规格</th>
                    <th style="width: 110px;">间距</th>
                    <th style="width: 130px;">保护层厚度</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, index) in formRows" :key="row.tempId">
                    <td>{{ index + 1 }}</td>
                    <td><input v-model="row.part" /></td>
                    <td><input v-model="row.axis" /></td>
                    <td><input v-model="row.secMeasured" /></td>
                    <td><input v-model="row.secAvg" /></td>
                    <td><input v-model="row.concreteGrade" /></td>
                    <td><input v-model="row.carb" /></td>
                    <td><input v-model="row.compNo" /></td>
                    <td><input v-model="row.steelSpec" /></td>
                    <td><input v-model="row.spacingDesign" /></td>
                    <td><input v-model="row.coverDesign" /></td>
                    <td>
                      <select v-model="row.scanDir">
                        <option>数字轴</option>
                        <option>字母轴</option>
                      </select>
                    </td>
                    <td><input v-model="row.coverData" /></td>
                    <td><input v-model="row.spacingData" /></td>
                    <td><input v-model="row.remark" /></td>
                    <td class="sticky-action">
                      <button class="text-btn danger" @click="removeRow(index)">删除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="light-btn" @click="closeAddModal">取消</button>
          <button class="primary-btn" @click="submitRecord">保存</button>
        </div>
      </div>
    </div>
  </div>
  <!-- 委托单选择弹窗 -->
  <div v-if="showOrderSelectModal" class="modal-mask" style="z-index: 3000;">
    <div class="modal-box" style="width: 800px; max-height: 80vh;">
      <div class="modal-header">
        <h3 class="modal-title">选择委托单</h3>
        <button class="close-btn-icon" @click="closeOrderSelector">×</button>
      </div>
      <div class="modal-content scroll-content" style="padding-top: 10px;">
        <!-- 删除了多余的 action-bar 布局框，将宽度设为100%以严格对齐下方表格，并加上底边距 -->
        <input v-model="orderSearchText" class="keyword-input" placeholder="搜索委托单编号、工程或单位..."
          style="width: 100%; margin-bottom: 16px; display: block;" />
        <table class="hierarchical-table edit-table" style="width: 100% !important; min-width: 100%;">
          <thead>
            <tr>
              <th style="width: 150px;">委托单编号</th>
              <th>工程名称</th>
              <th style="width: 200px;">委托单位</th>
              <th style="width: 80px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td style="color:#2a3f7a; font-weight:bold;">{{ order.orderNo }}</td>
              <td>{{ order.projectName }}</td>
              <td>{{ order.clientName }}</td>
              <td><button class="text-btn" @click="selectOrderForRecord(order)">选择</button></td>
            </tr>
            <tr v-if="filteredOrders.length === 0">
              <td colspan="4" style="padding: 30px; color: #909399;">未搜索到相关委托单</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showDetailModal = ref(false)
const showAddModal = ref(false)
const activeRecord = ref(null)
const modalMode = ref('add')
const editingId = ref(null)

const selectedIds = ref([])

// 全选/反选计算属性
const isAllSelected = computed({
  get: () => paginatedRecords.value.length > 0 && paginatedRecords.value.every(i => selectedIds.value.includes(i.id)),
  set: (val) => {
    selectedIds.value = val ? paginatedRecords.value.map(i => i.id) : []
  }
})

// 批量删除方法
function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    alert('请先选择要删除的记录')
    return
  }
  if (confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`)) {
    records.value = records.value.filter(item => !selectedIds.value.includes(item.id))
    selectedIds.value = [] // 清空选项
    // 修正当前页码
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  }
}

const form = reactive({
  orderNo: 'WT-2026-001',
  recordNo: '',
  recordName: '柱参数检测记录表',
  projectName: '',
  sampleNo: '',
  checkDate: new Date().toISOString().split('T')[0],
  instrument: [],
  basis: []
})

const formRows = ref([])

const defaultRows = [
  {
    tempId: 1,
    part: '一层 A 轴框架柱',
    axis: 'A-1',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-01',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '24, 25, 26, 25',
    spacingData: '198, 201, 200',
    remark: '数据正常'
  },
  {
    tempId: 2,
    part: '一层 A 轴框架柱',
    axis: 'A-2',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-02',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '25, 26, 25, 24',
    spacingData: '199, 200, 201',
    remark: '数据正常'
  },
  {
    tempId: 3,
    part: '一层 A 轴框架柱',
    axis: 'A-3',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-03',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '24, 25, 25, 26',
    spacingData: '200, 201, 199',
    remark: '数据正常'
  },
  {
    tempId: 4,
    part: '一层 A 轴框架柱',
    axis: 'A-4',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-04',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '26, 25, 24, 25',
    spacingData: '198, 200, 202',
    remark: '数据正常'
  },
  {
    tempId: 5,
    part: '一层 A 轴框架柱',
    axis: 'A-5',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-05',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '25, 25, 26, 25',
    spacingData: '200, 200, 201',
    remark: '数据正常'
  },
  {
    tempId: 6,
    part: '一层 A 轴框架柱',
    axis: 'A-6',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-06',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '24, 26, 25, 25',
    spacingData: '199, 201, 200',
    remark: '数据正常'
  },
  {
    tempId: 7,
    part: '一层 A 轴框架柱',
    axis: 'A-7',
    secMeasured: '600×600',
    secAvg: '600',
    concreteGrade: 'C35',
    carb: '1.5',
    compNo: 'KZ-07',
    steelSpec: 'HRB400 Φ20',
    spacingDesign: '200',
    coverDesign: '25',
    scanDir: '数字轴',
    coverData: '25, 24, 25, 26',
    spacingData: '200, 202, 199',
    remark: '数据正常'
  }
]

const mockRecords = []
const projectNames = ['锦城绿道一期工程', '天府国际机场', '成都轨道交通18号线', '华西医院项目']

for (let i = 0; i < 15; i++) {
  const date = `2026-04-${String(i + 1).padStart(2, '0')}`

  mockRecords.push({
    id: 100 + i,
    orderNo: `WT-2026-${String(i + 1).padStart(3, '0')}`,
    recordName: '柱参数检测记录表',
    projectName: projectNames[i % 4],
    recordNo: `JL-REC-2026-${String(i + 1).padStart(3, '0')}`,
    createDate: `${date} 09:30:00`,
    checkDate: date,
    sampleNo: `YP-20260508-${String(i + 1).padStart(3, '0')}`,
    instrument: ['混凝土回弹仪(HT-225型)', '钢筋扫描仪(ZBL-R630A)', '卷尺(5m)'],
    basis: ['GB 50204-2015《混凝土结构工程施工质量验收规范》'],
    rows: copyRows(defaultRows)
  })
}

const records = ref(mockRecords)

const filteredRecords = computed(() => {
  if (!searchText.value) return records.value

  return records.value.filter(record => {
    return (
      (record.orderNo && record.orderNo.includes(searchText.value)) ||
      record.projectName.includes(searchText.value) ||
      record.recordNo.includes(searchText.value) ||
      record.recordName.includes(searchText.value)
    )
  })
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + Number(pageSize.value))
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRecords.value.length / Number(pageSize.value)))
})

const activeRecordRows = computed(() => {
  return activeRecord.value?.rows || []
})

function copyRows(rows) {
  return rows.map(row => ({
    ...row,
    tempId: Date.now() + Math.random()
  }))
}

function resetForm() {
  form.orderNo = 'WT-2026-001'
  form.recordNo = nextRecordNo()
  form.recordName = '柱参数检测记录表'
  form.projectName = ''
  form.sampleNo = ''
  form.checkDate = new Date().toISOString().split('T')[0]
  form.instrument = []
  form.basis = []
  formRows.value = copyRows(defaultRows)
}

function openAddModal() {
  modalMode.value = 'add'
  editingId.value = null
  resetForm()
  showAddModal.value = true
}

function editRecord(record) {
  modalMode.value = 'edit'
  editingId.value = record.id
  form.orderNo = record.orderNo || 'WT-2026-001'
  form.recordNo = record.recordNo
  form.recordName = record.recordName
  form.projectName = record.projectName
  form.sampleNo = record.sampleNo
  form.checkDate = record.checkDate
  form.instrument = Array.isArray(record.instrument) ? [...record.instrument] : []
  form.basis = Array.isArray(record.basis) ? [...record.basis] : []
  formRows.value = copyRows(record.rows || defaultRows)
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

function addRow() {
  formRows.value.push({
    tempId: Date.now() + Math.random(),
    part: '',
    axis: '',
    secMeasured: '',
    secAvg: '',
    concreteGrade: '',
    carb: '',
    compNo: '',
    steelSpec: '',
    spacingDesign: '',
    coverDesign: '',
    scanDir: '数字轴',
    coverData: '',
    spacingData: '',
    remark: ''
  })
}

function removeRow(index) {
  if (formRows.value.length > 1) {
    formRows.value.splice(index, 1)
  } else {
    alert('至少保留一行')
  }
}

function submitRecord() {
  if (!form.projectName) {
    alert('请输入工程名称')
    return
  }

  const data = {
    id: modalMode.value === 'edit' ? editingId.value : Date.now(),
    orderNo: form.orderNo,
    recordName: form.recordName || '柱参数检测记录表',
    projectName: form.projectName,
    recordNo: form.recordNo || nextRecordNo(),
    createDate: modalMode.value === 'edit' ? findCreateDate(editingId.value) : new Date().toLocaleString(),
    checkDate: form.checkDate,
    sampleNo: form.sampleNo || '未填写',
    instrument: [...form.instrument],
    basis: [...form.basis],
    rows: copyRows(formRows.value)
  }

  if (modalMode.value === 'edit') {
    const index = records.value.findIndex(item => item.id === editingId.value)
    if (index !== -1) records.value.splice(index, 1, data)
    alert('修改成功')
  } else {
    records.value.unshift(data)
    alert('新增成功')
  }

  showAddModal.value = false
}

function viewRecordDetail(record) {
  activeRecord.value = record
  showDetailModal.value = true
}

function deleteRecord(record) {
  if (!confirm(`确定删除记录“${record.recordNo}”吗？`)) return

  records.value = records.value.filter(item => item.id !== record.id)

  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
}

async function exportRecord(record) {
  const fileName = 'original-record-template.xlsx'
  const time = Date.now()

  const urls = [
    `/templates/${fileName}?t=${time}`,
    `${import.meta.env.BASE_URL || '/'}templates/${fileName}?t=${time}`
  ]

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store'
      })

      if (!response.ok) {
        continue
      }

      const arrayBuffer = await response.arrayBuffer()
      const header = new Uint8Array(arrayBuffer.slice(0, 2))

      // xlsx 文件本质是 zip，文件头必须是 PK
      if (header[0] !== 0x50 || header[1] !== 0x4b) {
        continue
      }

      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = `${record?.recordNo || '原始记录表'}-柱参数检测记录表.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      return
    } catch (error) {
      console.error(error)
    }
  }

  alert('没有读取到正确的 Excel 模板。请确认文件在 public/templates/original-record-template.xlsx，并直接访问 http://localhost:5173/templates/original-record-template.xlsx 测试。')
}

function nextRecordNo() {
  return `JL-REC-2026-${String(records.value.length + 1).padStart(3, '0')}`
}

function findCreateDate(id) {
  const target = records.value.find(item => item.id === id)
  return target?.createDate || new Date().toLocaleString()
}

function formatArray(value) {
  if (Array.isArray(value)) return value.join('、')
  return value || ''
}

watch(searchText, () => {
  currentPage.value = 1
})

watch(pageSize, () => {
  currentPage.value = 1
})

function selectOrderForRecord(order) {
  form.orderNo = order.orderNo;
  form.projectName = order.projectName; // 智能带出工程名称
  closeOrderSelector();
}

// ================= 委托单选择弹窗逻辑 =================
const showOrderSelectModal = ref(false)
const orderSearchText = ref('')

// 模拟“委托单管理”的库数据
const orderLibrary = ref([
  { id: 1, orderNo: 'WT-2026-001', projectName: '锦城绿道一期工程', clientName: '成都建工集团' },
  { id: 2, orderNo: 'WT-2026-002', projectName: '天府国际机场', clientName: '中建八局' },
  { id: 3, orderNo: 'WT-2026-003', projectName: '成都轨道交通18号线', clientName: '成都地铁公司' },
  { id: 4, orderNo: 'WT-2026-004', projectName: '华西医院扩建项目', clientName: '华西集团' },
  { id: 5, orderNo: 'WT-2026-005', projectName: '高新区V20地块', clientName: '高投集团' }
])

// 弹窗内的搜索过滤逻辑
const filteredOrders = computed(() => {
  if (!orderSearchText.value) return orderLibrary.value
  const keyword = orderSearchText.value.toLowerCase()
  return orderLibrary.value.filter(o =>
    o.orderNo.toLowerCase().includes(keyword) ||
    o.projectName.toLowerCase().includes(keyword) ||
    o.clientName.toLowerCase().includes(keyword)
  )
})

function openOrderSelector() {
  orderSearchText.value = ''
  showOrderSelectModal.value = true
}

function closeOrderSelector() {
  showOrderSelectModal.value = false
}

</script>

<style scoped>
/* ==========================================
   1. 页面整体布局与顶部操作栏 (严格对齐第五模块)
   ========================================== */
.digital-record-page {
  padding: 20px !important;
  background-color: #f5f7fa !important;
  min-height: calc(100vh - 60px) !important;
  box-sizing: border-box !important;
  color: #1e293b !important;
}

.record-main-container {
  background-color: transparent !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  margin-top: 0 !important;
}

.action-bar {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  background-color: #ffffff !important;
  padding: 16px 24px !important;
  border-radius: 18px !important;
  /* 对齐 18px 大圆角 */
  margin-bottom: 20px !important;
  border: 1px solid #e3e9f3 !important;
  box-shadow: 0 10px 28px rgba(42, 63, 122, 0.07) !important;
}

.bar-title {
  font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important;
  font-size: 20px !important;
  font-weight: bold !important;
  color: #2a3f7a !important;
  border-left: 4px solid #2a3f7a !important;
  padding-left: 12px !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}

.bar-actions {
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
}

/* 搜索框 (对齐第二模块的 38px 高度与 10px 圆角) */
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

/* 操作按钮 (对齐第二模块的圆润风格) */
.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  height: 38px !important;
  padding: 0 18px !important;
  box-sizing: border-box !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  border: 1px solid transparent !important;
}

.btn-primary {
  background: #2a3f7a !important;
  color: #fff !important;
}

.btn-primary:hover {
  background: #3e5a9e !important;
  transform: translateY(-1px);
}

.btn-danger {
  background: #f56c6c !important;
  color: #fff !important;
}

.btn-danger:hover {
  background: #f78989 !important;
  transform: translateY(-1px);
}

/* 表格内部的文字按钮 */
.text-btn {
  border: none !important;
  background: transparent !important;
  color: #2a3f7a !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  padding: 0 6px !important;
}

.text-btn:hover {
  text-decoration: underline !important;
}

.text-btn.danger {
  color: #f56c6c !important;
}

/* ==========================================
   3. 列表表格 (完美复刻第五模块 13px、深蓝表头与边框间距)
   ========================================== */
.table-wrapper {
  background-color: #ffffff !important;
  padding: 24px !important;
  /* 👇 核心修改：将圆角从 4px 增大到 18px */
  border-radius: 18px !important;
  /* 👇 修改边框为更清透的淡蓝色描边 */
  border: 1px solid #e3e9f3 !important;
  /* 👇 新增：加入第二模块同款的柔和投影，提升立体感 */
  box-shadow: 0 10px 28px rgba(42, 63, 122, 0.07) !important;
  margin-top: 0 !important;
  margin-bottom: 20px !important;
}

.table-wrap {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  overflow-x: auto !important;
}

.list-table table {
  width: 100% !important;
  border-collapse: collapse !important;
  text-align: center !important;

  /* 👇 核心：对齐第五模块的字体设置 */
  font-size: 13px !important;
  color: #334155 !important;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}

.list-table th,
.list-table td {
  padding: 14px 12px !important;
  border-bottom: 1px solid #edf2f7 !important;
  border-right: none !important;
  /* 去除竖向边框 */
  height: auto !important;
}

/* 顺便微调表头权重，对齐第五模块的 800 字重 */
.list-table th {
  background: #f3f6fb !important;
  color: #2a3f7a !important;
  font-weight: 800 !important;
  /* 对齐第五模块的极粗体感 */
  font-size: 13px !important;
  text-align: center !important;
  white-space: nowrap !important;
}

.list-table td {
  color: #334155 !important;
  font-size: 13px !important;
  text-align: center !important;
}

.list-table tbody tr:hover {
  background-color: #f5f7fa !important;
}

/* 2. 记录名称：取消加粗 */
.bold-text {
  font-weight: normal !important;
  /* 取消加粗，改为常规粗细 */
  color: #1e293b !important;
  /* 保持主要文字颜色 */
}

/* ==========================================
   1. 记录编号与委托单编号：提高权重确保华测蓝生效
   ========================================== */
.list-table table td.code-text,
.list-table table td.order-no-text,
.list-table td.order-no-text {
  color: #2a3f7a !important;
  /* 👈 华测蓝 */
  font-weight: 700 !important;
  /* 👈 强制加粗 */
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;
}

/* ==========================================
   4. 复选框样式 (对齐第五模块)
   ========================================== */
.cb-wrap {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  cursor: pointer !important;
  font-size: 14px !important;
  color: #606266 !important;
  user-select: none !important;
}

.cb-wrap input {
  display: none !important;
}

.cb-icon {
  width: 16px !important;
  height: 16px !important;
  border: 2px solid #dcdfe6 !important;
  border-radius: 3px !important;
  display: inline-block !important;
  transition: all 0.2s !important;
  position: relative !important;
}

.cb-wrap input:checked+.cb-icon {
  background: #2a3f7a !important;
  border-color: #2a3f7a !important;
}

.cb-wrap input:checked+.cb-icon::after {
  content: '' !important;
  position: absolute !important;
  left: 4px !important;
  top: 1px !important;
  width: 4px !important;
  height: 8px !important;
  border: solid #fff !important;
  border-width: 0 2px 2px 0 !important;
  transform: rotate(45deg) !important;
}

/* ==========================================
   5. 翻页组件 (对齐第五模块方形小按钮)
   ========================================== */
.pagination {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  margin-top: 20px !important;
  font-size: 13px !important;
  color: #606266 !important;
}

.total-text {
  margin-right: 15px !important;
}

.page-select {
  padding: 2px 5px !important;
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  margin-right: 15px !important;
  color: #606266 !important;
  height: 28px !important;
  outline: none !important;
  background: #fff !important;
}

.pager-btns {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
}

.pager-arrow,
.pager-num {
  display: inline-flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 28px !important;
  height: 28px !important;
  background-color: #f4f4f5 !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  font-size: 13px !important;
  color: #606266 !important;
}

.pager-arrow:hover:not(.disabled) {
  color: #2a3f7a !important;
}

.pager-arrow.disabled {
  color: #c0c4cc !important;
  cursor: not-allowed !important;
}

.pager-num.active {
  background-color: #2a3f7a !important;
  color: #fff !important;
  font-weight: bold !important;
}

/* ==========================================
   6. 第六模块专属弹窗与复杂表格样式 (融合颜色与字体)
   ========================================== */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.modal-box {
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-modal,
.add-modal {
  width: 1350px;
  max-width: 92vw;
  max-height: 92vh;
}

.modal-header {
  padding: 24px 26px;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
  align-items: center;
}

.modal-title {
  border-left: 4px solid #2a3f7a;
  padding-left: 10px;
  color: #2A3F7A;
  font-weight: bold;
  margin: 0;
  line-height: 1.1;
  font-size: 20px;
}

.modal-subtitle {
  margin: 8px 0 0 14px;
  color: #7a86a0;
  font-size: 13px;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-btn-icon {
  border: none;
  background: transparent;
  color: #909399;
  font-size: 26px;
  cursor: pointer;
  padding: 0 4px;
}

.close-btn-icon:hover {
  color: #f56c6c;
}

.modal-content {
  padding: 26px;
  flex: 1;
}

.scroll-content {
  overflow-y: auto;
}

.fixed-content {
  overflow: hidden;
}

.form-section {
  margin-bottom: 25px;
}

.section-title {
  color: #2A3F7A;
  font-weight: bold;
  margin-bottom: 16px;
  font-size: 17px;
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-grid span {
  color: #6b7a99;
  font-size: 13px;
  font-weight: bold;
}

.form-grid input,
.form-grid select {
  min-height: 40px;
  border: 1px solid #dfe7f2;
  border-radius: 10px;
  padding: 8px 12px;
  background: #f8fafd;
  outline: none;
  box-sizing: border-box;
}

.full-width {
  grid-column: span 2;
}

.section-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.primary-btn {
  background: #2A3F7A;
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.light-btn {
  background: #f2f5fb;
  color: #2A3F7A;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

/* 复杂嵌套表格 */
.edit-table-wrap {
  border: 1px solid #e3e9f3;
  overflow-x: auto !important;
  overflow-y: visible;
  position: relative;
  width: 100%;
}

.hierarchical-table {
  width: 2200px !important;
  min-width: 100%;
  border-collapse: collapse;
}

.hierarchical-table th[rowspan] {
  vertical-align: middle !important;
}

.hierarchical-table input,
.hierarchical-table select {
  width: 100%;
  border: 1px solid #dfe7f2;
  background: #f8fafd;
  text-align: center;
  outline: none;
  padding: 8px 4px;
  color: #334155;
  border-radius: 4px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.hierarchical-table input:focus,
.hierarchical-table select:focus {
  background: #ffffff;
  border-color: #2A3F7A;
}

.hierarchical-table thead tr th {
  background-color: #f3f6fb !important;
  z-index: 10;
  padding: 12px 10px;
  text-align: center;
  border: 1px solid #edf2f7;
  font-size: 13px;
  color: #2A3F7A;
  font-weight: bold;
}

.hierarchical-table td {
  padding: 12px 10px;
  text-align: center;
  border: 1px solid #edf2f7;
  font-size: 13px;
  word-break: break-all;
  color: #334155;
}

.sticky-action {
  position: sticky;
  right: 0;
  background: #f3f6fb;
  z-index: 5;
}

.modal-footer {
  padding: 18px 26px 24px;
  border-top: 1px solid #edf2f7;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.basic-info-table {
  border: 1px solid #e3e9f3;
  margin-bottom: 20px;
}

.basic-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-bottom: 1px solid #e3e9f3;
}

.basic-row:last-child {
  border-bottom: none;
}

.basic-cell {
  padding: 14px 16px;
  background: #f8fafd;
  border-right: 1px solid #e3e9f3;
}

.basic-cell:last-child {
  border-right: none;
}

.basic-cell.full-span {
  grid-column: span 2;
}

.basic-cell span {
  display: block;
  color: #6b7a99;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
}

.basic-cell strong {
  font-size: 14px;
  color: #1e293b;
}

.detail-table-scroll {
  max-height: 360px;
  overflow: auto;
  border: 1px solid #e3e9f3;
}

.detail-view-table {
  width: 2400px !important;
  min-width: 2400px;
}

/* Element 极简多选框覆盖 */
:deep(.plain-text-select .el-select__wrapper) {
  flex-wrap: nowrap !important;
  overflow: hidden !important;
}

:deep(.plain-text-select .el-tag) {
  background-color: transparent !important;
  border: none !important;
  color: #1e293b !important;
  padding: 0 !important;
  margin: 0 !important;
  max-width: none !important;
}

:deep(.plain-text-select .el-tag__close) {
  display: none !important;
}

:deep(.plain-text-select .el-tag:not(:last-of-type)::after) {
  content: '、';
  color: #1e293b;
}

:deep(.plain-text-select .el-select__input-wrapper) {
  display: none !important;
}

/* ==========================================
   输入框 + 选择按钮的并排容器样式
   ========================================== */
.input-with-btn {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  width: 100% !important;
}

.input-with-btn input {
  flex: 1 !important;
  width: auto !important;
}

/* ==========================================
   “选择”按钮：弱化按钮轮廓，强化文字引导
   ========================================== */
.select-btn {
  height: 38px !important;
  padding: 0 8px !important;
  /* 去掉边框后，左右内边距可以小一点 */
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  margin: 0 !important;

  /* 1. 彻底弱化按钮本身（去掉背景色、边框、阴影） */
  background-color: transparent !important;
  border: 1px solid transparent !important;
  box-shadow: none !important;

  /* 2. 强化文字本身（华测深蓝 + 加粗） */
  color: #2a3f7a !important;
  font-weight: 700 !important;
  font-size: 14px !important;

  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

/* 鼠标悬浮时只增加下划线 */
.select-btn:hover {
  background-color: transparent !important;
  text-decoration: underline !important;
  /* 仅加下划线明确可点击 */
}
</style>