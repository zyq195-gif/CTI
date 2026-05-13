<template>
  <div class="scheduling-module">
    <div class="action-bar">
      <div class="bar-title">人员排单管理</div>
      <div class="bar-actions">
        <input
          v-model.trim="keyword"
          type="text"
          class="keyword-input"
          placeholder="搜索人员、状态或内容"
          style="width: 200px;"
        />
        <div class="date-range-group">
          <input type="date" v-model="dateRangeStart" class="range-input" />
          <span class="range-separator">至</span>
          <input type="date" v-model="dateRangeEnd" class="range-input" />
        </div>
        
        <!-- 切换编辑模式按钮 -->
        <button :class="['btn', isEditing ? 'btn-danger' : 'btn-default']" type="button" @click="toggleEdit">
          <i :class="isEditing ? 'fa-solid fa-times' : 'fa-solid fa-edit'"></i>
          {{ isEditing ? '退出修改' : '修改排单' }}
        </button>
        <button class="btn btn-primary" type="button" @click="exportPreviewExcel">
          <i class="fa-solid fa-download"></i> 导出
        </button>
      </div>
    </div>

    <!-- 主表呈现原有的预览内容 -->
    <div class="table-wrapper">
      <div class="preview-meta">
        <span>时间范围：{{ previewRangeLabel }}</span>
        <span v-if="isEditing" class="edit-hint">
          <i class="fa-solid fa-circle-info"></i> 当前处于修改模式，可直接点击单元格修改内容
        </span>
        <span v-else>排单记录：{{ filteredRecords.length }} 条</span>
      </div>

      <div class="excel-preview-wrap">
        <table class="excel-preview-table">
          <thead>
            <tr>
              <th class="preview-group-col"></th>
              <th class="preview-owner-col"></th>
              <th class="preview-person-col">DATE</th>
              <th v-for="date in previewDates" :key="date" colspan="2">
                {{ date }}
              </th>
            </tr>
            <tr>
              <th class="preview-group-col"></th>
              <th class="preview-owner-col"></th>
              <th class="preview-person-col"></th>
              <th v-for="date in previewDates" :key="`${date}-weekday`" colspan="2">
                {{ weekdayLabel(date) }}
              </th>
            </tr>
            <tr>
              <th class="preview-group-col">分组</th>
              <th class="preview-owner-col">填写人</th>
              <th class="preview-person-col">人员</th>
              <template v-for="date in previewDates" :key="`${date}-periods`">
                <th>上午</th>
                <th>下午</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in previewRows" :key="`${row.group}-${row.person}`">
              <!-- 分组 -->
              <td v-if="row.groupRowspan" class="preview-group-col" :rowspan="row.groupRowspan">
                {{ row.group }}
              </td>
              
              <!-- 填写人 (编辑模式下直接可改) -->
              <td class="preview-owner-col">
                <input 
                  v-if="isEditing && row.group !== '项目信息区'" 
                  type="text" 
                  :value="row.owner" 
                  @change="e => updateOwner(row.person, row.group, e.target.value)" 
                  class="edit-input" 
                />
                <span v-else>{{ row.owner }}</span>
              </td>
              
              <!-- 人员 -->
              <td class="preview-person-col">{{ row.person }}</td>
              
              <!-- 上午/下午格 -->
              <template v-for="date in previewDates" :key="`${row.person}-${date}`">
                <!-- 上午单元格 -->
                <td 
                  :class="['preview-cell', previewStatusClass(row.cells[date]?.morning?.status), (isEditing && row.group !== '项目信息区') ? 'is-editable' : '']" 
                  @click="handleCellClick(row, date, 'morning')"
                >
                  <template v-if="row.cells[date]?.morning">
                    <span class="preview-status">{{ row.cells[date].morning.status }}</span>
                    <span>{{ row.cells[date].morning.content }}</span>
                  </template>
                  <span v-else class="preview-empty">-</span>
                </td>
                
                <!-- 下午单元格 -->
                <td 
                  :class="['preview-cell', previewStatusClass(row.cells[date]?.afternoon?.status), (isEditing && row.group !== '项目信息区') ? 'is-editable' : '']" 
                  @click="handleCellClick(row, date, 'afternoon')"
                >
                  <template v-if="row.cells[date]?.afternoon">
                    <span class="preview-status">{{ row.cells[date].afternoon.status }}</span>
                    <span>{{ row.cells[date].afternoon.content }}</span>
                  </template>
                  <span v-else class="preview-empty">-</span>
                </td>
              </template>
            </tr>

            <tr v-if="previewRows.length === 0">
              <td :colspan="previewEmptyColspan" class="empty-text" style="height: 180px; color: #909399;">暂无排单数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 单元格排单信息弹窗 -->
    <el-dialog v-model="cellDialogVisible" title="填写单元格排单" width="460px">
      <el-form :model="cellForm" label-width="80px" class="styled-form">
        <!-- 只读展示区 -->
        <div class="detail-row" style="margin-bottom: 20px; padding: 12px 16px;">
          <span>当前修改位置</span>
          <strong>{{ cellForm.date }} ({{ cellForm.period }}) - {{ cellForm.person }}</strong>
        </div>

        <el-form-item label="排单类型">
          <el-select v-model="cellForm.status" class="form-control">
            <el-option label="现场" value="现场" />
            <el-option label="内业" value="内业" />
            <el-option label="休假" value="休假" />
            <el-option label="外出" value="外出" />
            <el-option label="待安排" value="待安排" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排单详情">
          <textarea
            v-model="cellForm.content"
            rows="4"
            placeholder="请在此输入排单详情内容... (若清空内容则表示删除该排单)"
            class="custom-textarea"
          ></textarea>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cellDialogVisible = false">取消</el-button>
        <el-button type="primary" class="primary-btn" @click="saveCellRecord">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  schedulingTemplateRows,
  templateEndDate,
  templateRecords,
  templateStartDate
} from './scheduleData'

defineOptions({ name: 'StaffScheduling' })

const records = ref([...templateRecords])
// 采用响应式以允许本地修改“填写人”字段
const localTemplateRows = ref(JSON.parse(JSON.stringify(schedulingTemplateRows)))

const keyword = ref('')
const dateRangeStart = ref('')
const dateRangeEnd = ref('')
let nextId = templateRecords.length + 1

const isEditing = ref(false)
const cellDialogVisible = ref(false)

const cellForm = ref({
  person: '',
  group: '',
  date: '',
  period: '',
  status: '现场',
  content: ''
})

const previewPeriods = [
  { key: 'morning', label: '上午' },
  { key: 'afternoon', label: '下午' }
]

const normalizedDateRange = computed(() => {
  if (!dateRangeStart.value || !dateRangeEnd.value) {
    return null
  }
  return dateRangeStart.value <= dateRangeEnd.value
    ? [dateRangeStart.value, dateRangeEnd.value]
    : [dateRangeEnd.value, dateRangeStart.value]
})

const filteredRecords = computed(() => {
  const text = keyword.value.trim()
  const range = normalizedDateRange.value

  return records.value.filter((item) => {
    const matchesKeyword = !text || [item.date, item.period, item.group, item.person, item.content, item.status]
      .join(' ')
      .includes(text)
    const matchesDate = !range || (item.date >= range[0] && item.date <= range[1])
    return matchesKeyword && matchesDate
  })
})

const previewDates = computed(() => {
  const range = normalizedDateRange.value
  if (range) return createDateSeries(range[0], range[1])
  return createDateSeries(templateStartDate, templateEndDate)
})

const previewRows = computed(() => {
  const scheduleMap = createScheduleMap(filteredRecords.value)
  const templatePeople = new Set(localTemplateRows.value.map((row) => row.person))
  
  // 对于模板中没有的人员，如果存在记录，动态添加呈现
  const dynamicRows = filteredRecords.value
    .filter((record) => !templatePeople.has(record.person))
    .map((record) => ({ group: record.group, owner: '', person: record.person }))
    
  const sourceRows = dedupeTemplateRows([...localTemplateRows.value, ...dynamicRows])

  const rows = sourceRows.map((templateRow) => {
    const cells = {}
    previewDates.value.forEach((date) => {
      cells[date] = {
        morning: scheduleMap.get(`${templateRow.person}__${date}__morning`) || null,
        afternoon: scheduleMap.get(`${templateRow.person}__${date}__afternoon`) || null
      }
    })
    return {
      ...templateRow,
      cells,
      groupRowspan: 0
    }
  })

  return applyGroupRowspans(rows)
})

const previewEmptyColspan = computed(() => {
  return Math.max(3 + previewDates.value.length * 2, 3)
})

const previewRangeLabel = computed(() => {
  const range = normalizedDateRange.value
  if (range) return `${range[0]} 至 ${range[1]}`
  if (previewDates.value.length === 0) return '全部日期'
  return `${previewDates.value[0]} 至 ${previewDates.value[previewDates.value.length - 1]}`
})

// === 方法区 ===

function toggleEdit() {
  isEditing.value = !isEditing.value
}

// 修改“填写人”
function updateOwner(person, group, newOwner) {
  const row = localTemplateRows.value.find(r => r.person === person && r.group === group)
  if (row) {
    row.owner = newOwner
  } else {
    localTemplateRows.value.push({ group, person, owner: newOwner })
  }
}

// 单元格点击事件
function handleCellClick(row, date, periodKey) {
  if (!isEditing.value) return
  
  // 如果是项目信息区，直接终止函数，什么都不做（不弹窗也不提示）
  if (row.group === '项目信息区') {
    return
  }

  const periodLabel = periodKey === 'morning' ? '上午' : '下午'
  
  // 获取该格子内已有的排单内容(为了防止过滤影响，全量查找)
  const matchingRecords = records.value.filter(r =>
    r.person === row.person &&
    r.date === date &&
    r.period === periodLabel
  )
  
  let initialStatus = '现场'
  let initialContent = ''

  if (matchingRecords.length > 0) {
    initialStatus = matchingRecords[0].status
    // 假设有多条旧排单，将其拼接显示在一块修改
    initialContent = matchingRecords.map(r => r.content).join('；')
  }

  cellForm.value = {
    person: row.person,
    group: row.group,
    date: date,
    period: periodLabel,
    status: initialStatus,
    content: initialContent
  }

  cellDialogVisible.value = true
}

// 单元格排单保存
function saveCellRecord() {
  // 删除掉对应格子内原来的所有记录
  records.value = records.value.filter(r =>
    !(r.person === cellForm.value.person && 
      r.date === cellForm.value.date && 
      r.period === cellForm.value.period)
  )

  const finalContent = cellForm.value.content.trim()
  
  // 只要没清空内容，就代表新增该时段的排单(若清空了，则相当于删除了这段排单)
  if (finalContent) {
    records.value.push({
      id: nextId++,
      date: cellForm.value.date,
      period: cellForm.value.period,
      group: cellForm.value.group,
      person: cellForm.value.person,
      content: finalContent,
      status: cellForm.value.status
    })
  }

  cellDialogVisible.value = false
  ElMessage.success('保存成功')
}

// --- 辅助渲染和数据处理函数 ---

function previewStatusClass(status) {
  if (status === '现场') return 'preview-field'
  if (status === '内业') return 'preview-office'
  if (status === '休假') return 'preview-leave'
  if (status === '外出') return 'preview-outside'
  if (status === '待安排') return 'preview-pending'
  if (status === '多项') return 'preview-multiple'
  return 'preview-blank'
}

function mergePreviewCell(existing, record) {
  if (!existing) {
    return {
      content: record.content,
      status: record.status
    }
  }
  return {
    content: `${existing.content}；${record.content}`,
    status: existing.status === record.status ? existing.status : '多项'
  }
}

function createScheduleMap(sourceRecords) {
  const map = new Map()
  sourceRecords.forEach((record) => {
    const periodKey = record.period === '下午' ? 'afternoon' : 'morning'
    const key = `${record.person}__${record.date}__${periodKey}`
    map.set(key, mergePreviewCell(map.get(key), record))
  })
  return map
}

function dedupeTemplateRows(sourceRows) {
  const seen = new Set()
  return sourceRows.filter((row) => {
    const key = `${row.group}__${row.person}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function applyGroupRowspans(rows) {
  let index = 0
  while (index < rows.length) {
    const group = rows[index].group
    let end = index + 1
    while (end < rows.length && rows[end].group === group) {
      end += 1
    }
    rows[index].groupRowspan = end - index
    index = end
  }
  return rows
}

function createDateSeries(start, end) {
  const dates =[]
  const current = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)
  while (current <= last) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function weekdayLabel(dateText) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(`${dateText}T00:00:00`).getDay()]
}

function exportPreviewExcel() {
  const title = `人员排单汇总_${previewRangeLabel.value}`
  const headerDateCells = previewDates.value
    .map((date) => `<th colspan="2">${escapeHtml(date)}</th>`)
    .join('')
  const headerWeekdayCells = previewDates.value
    .map((date) => `<th colspan="2">${escapeHtml(weekdayLabel(date))}</th>`)
    .join('')
  const headerPeriodCells = previewDates.value
    .flatMap(() => previewPeriods.map((period) => `<th>${escapeHtml(period.label)}</th>`))
    .join('')
    
  const bodyRows = previewRows.value.length > 0
    ? previewRows.value.map((row) => {
      const cells = previewDates.value.flatMap((date) => {
        return previewPeriods.map((period) => {
          const cell = row.cells[date]?.[period.key]
          const text = cell ? `${cell.status} ${cell.content}` : ''
          return `<td>${escapeHtml(text)}</td>`
        })
      }).join('')
      return `<tr><td>${escapeHtml(row.group)}</td><td>${escapeHtml(row.owner)}</td><td>${escapeHtml(row.person)}</td>${cells}</tr>`
    }).join('')
    : `<tr><td colspan="${previewEmptyColspan.value}">暂无排单数据</td></tr>`

  const tableHtml = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; font-family: "Microsoft YaHei", Arial, sans-serif; font-size: 12px; }
          th, td { border: 1px solid #9ca3af; padding: 8px 10px; min-width: 120px; text-align: center; mso-number-format: "\\@"; }
          th { background: #eef2ff; font-weight: 700; }
          td:nth-child(1), td:nth-child(2), td:nth-child(3) { background: #f8fafc; font-weight: 600; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr><th></th><th></th><th>DATE</th>${headerDateCells}</tr>
            <tr><th></th><th></th><th></th>${headerWeekdayCells}</tr>
            <tr><th>分组</th><th>填写人</th><th>人员</th>${headerPeriodCells}</tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </body>
    </html>
  `
  const blob = new Blob(['\ufeff', tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[\\/:*?"<>|]/g, '-')}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function escapeHtml(value) {
  return `${value ?? ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
</script>

<style scoped>
.scheduling-module {
  min-height: calc(100vh - 128px);
  padding: 20px;
  background: #f5f7fa;
  color: #1e293b;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.action-bar {
  display: flex; justify-content: space-between; align-items: center;
  background-color: #ffffff; padding: 16px 20px; border-radius: 8px;
  margin-bottom: 20px; border: 1px solid #ebeef5;
  box-shadow: 0 4px 14px rgba(42, 63, 122, 0.04);
}

.bar-title {
  font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important;
  font-size: 20px; font-weight: bold; color: #2a3f7a;
  border-left: 4px solid #2a3f7a; padding-left: 12px; margin: 0; line-height: 1.2;
}

.bar-actions { display: flex; gap: 12px; align-items: center; }

.keyword-input {
  height: 38px !important;
  border: 1px solid #dfe7f2 !important;
  border-radius: 8px !important;
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

.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  height: 38px !important;
  width: auto !important;           /* 修改为自动宽度 */
  min-width: 104px !important;      /* 保持原来的最小宽度 */
  padding: 0 16px !important;       /* 增加左右内边距留出空间 */
  box-sizing: border-box !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  border: 1px solid transparent !important;
  font-family: inherit !important;
}

.btn-primary { background: #2a3f7a; color: #fff; border-color: #2a3f7a; }
.btn-primary:hover { background: #3e5a9e; border-color: #3e5a9e; }
.btn-danger { background: #f56c6c; color: #fff; border-color: #f56c6c; }
.btn-danger:hover { background: #f89898; border-color: #f89898; }
.btn-default { background: #fff; color: #606266; border-color: #dcdfe6; }
.btn-default:hover { color: #2a3f7a; border-color: #2a3f7a; }

.table-wrapper {
  background-color: #ffffff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e3e9f3;
  box-shadow: 0 8px 24px rgba(42, 63, 122, 0.05);
}

.preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}

.edit-hint {
  color: #f56c6c;
  background-color: #fef0f0;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: normal;
}

/* ==========================================
   排单网格样式
   ========================================== */
.excel-preview-wrap {
  height: calc(100vh - 280px);
  min-height: 400px;
  overflow: auto;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
}

.excel-preview-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  color: #1e293b;
  font-size: 13px;
  table-layout: fixed;
}

.excel-preview-table th,
.excel-preview-table td {
  min-width: 150px;
  border: 1px solid #dcdfe6;
  padding: 1px 12px;  
  text-align: center;
  vertical-align: middle;
}

.excel-preview-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #eef2ff;
  color: #2a3f7a;
  font-weight: 700;
  box-shadow: 0 1px 0 #dcdfe6;
}

.excel-preview-table thead tr:nth-child(2) th { top: 39px; }
.excel-preview-table thead tr:nth-child(3) th { top: 78px; }

.excel-preview-table .preview-group-col,
.excel-preview-table .preview-owner-col,
.excel-preview-table .preview-person-col {
  position: sticky;
  z-index: 3;
  min-width: 120px;
  background: #f8fafc;
  font-weight: 600;
  box-shadow: 1px 0 0 #dcdfe6;
}

.excel-preview-table .preview-group-col { left: 0; }
.excel-preview-table .preview-owner-col { left: 120px; }
.excel-preview-table .preview-person-col { left: 240px; }

.excel-preview-table thead .preview-group-col,
.excel-preview-table thead .preview-owner-col,
.excel-preview-table thead .preview-person-col {
  z-index: 4;
  background: #e8edff;
  box-shadow: 1px 1px 0 #dcdfe6;
}

/* 单元格及内容展现 */
.preview-cell {
  max-width: 220px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
  transition: all 0.2s;
}

.is-editable {
  cursor: pointer;
}
.is-editable:hover {
  filter: brightness(0.95);
  box-shadow: inset 0 0 0 1px #2a3f7a;
}

.preview-status {
  display: inline-block;
  min-width: 42px;
  margin-right: 6px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.2;
}

.preview-field { background: #eef4ff; color: #2a3f7a; }
.preview-office { background: #f0f9eb; color: #3f8f24; }
.preview-leave { background: #f4f4f5; color: #606266; }
.preview-outside { background: #fdf6ec; color: #b97916; }
.preview-pending { background: #ffffff; color: #909399; }
.preview-multiple { background: #fef0f0; color: #d93026; }
.preview-blank { background: #ffffff; color: #909399; }
.preview-empty { color: #c0c4cc; }

.edit-input {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px;
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  background-color: transparent;
  transition: all 0.2s;
}
.edit-input:focus {
  border-color: #2a3f7a;
  background-color: #fff;
  box-shadow: 0 0 4px rgba(42, 63, 122, 0.2);
}

/* ==========================================
   弹窗及其表单组件样式
   ========================================== */
.detail-row {
  background: #f8fafd;
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.detail-row span {
  display: block;
  margin-bottom: 6px;
  color: #6b7a99;
  font-size: 13px;
  font-weight: 700;
}
.detail-row strong {
  display: block;
  color: #1e293b;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
}

.form-control { width: 100%; }

.custom-textarea {
  width: 100%;
  border: 1px solid #dfe7f2;
  border-radius: 8px;
  background-color: #f8fafd;
  padding: 10px 12px;
  outline: none;
  box-sizing: border-box;
  font-size: 14px;
  color: #1e293b;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}
.custom-textarea:focus {
  border-color: #2a3f7a;
  background-color: #fff;
}

.date-range-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.range-input {
  width: 140px !important;
  height: 38px !important;
  border: 1px solid #dfe7f2 !important;
  border-radius: 8px !important;
  padding: 0 12px !important;
  font-size: 14px !important;
  outline: none !important;
  color: #1e293b !important;
  background-color: #f8fafd !important;
}
.range-input:focus { border-color: #2a3f7a !important; background-color: #fff !important; }
.range-separator { color: #6b7a99; font-size: 14px; font-weight: bold; }

:deep(.el-dialog__title) {
  font-size: 16px !important;
  color: #1e293b !important;
  font-weight: 600 !important;
  border-left: 4px solid #2a3f7a;
  padding-left: 10px;
  line-height: 1.1;
  display: inline-block;
}

:deep(.el-dialog__footer) {
  padding: 15px 25px 20px;
  border-top: 1px solid #f0f2f5;
}

@media (max-width: 760px) {
  .scheduling-module { padding: 14px; }
  .action-bar { align-items: flex-start; flex-direction: column; }
  .bar-actions, .search-input, .date-range-group { width: 100%; }
  .bar-actions { align-items: stretch; flex-direction: column; }
  .excel-preview-table th, .excel-preview-table td { min-width: 128px; }
}
</style>