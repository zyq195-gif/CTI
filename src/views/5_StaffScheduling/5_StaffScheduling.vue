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
        <!-- 修正1：包裹的 div，确保布局对齐 -->
        <div class="date-range-group">
          <input type="date" v-model="dateRangeStart" class="range-input" />
          <span class="range-separator">至</span>
          <input type="date" v-model="dateRangeEnd" class="range-input" />
        </div>
        <button class="btn btn-default" type="button" @click="openPreviewDialog">排单预览</button>
        <button class="btn btn-primary" type="button" @click="openAddDialog">
          <i class="fa-solid fa-plus"></i> 新增
        </button>
        <button class="btn btn-danger" type="button" @click="deleteSelected">
          <i class="fa-solid fa-trash" style="margin-right: 4px;"></i> 删除
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="table-wrap">
        <table class="schedule-table">
          <thead>
            <tr>
              <th width="5%">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" :checked="isAllSelected" @change="e => toggleSelectAll(e.target.checked)">
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th width="6%">序号</th>
              <th width="10%">人员</th>
              <th width="12%">小组</th>
              <th width="8%">时段</th>
              <th width="20%">排单内容</th>
              <th width="8%">状态</th>
              <th width="18%">创建时间</th>
              <th width="13%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in paginatedRecords" :key="item.id">
              <td class="check-col">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="e => toggleRow(item.id, e.target.checked)">
                  <span class="cb-icon"></span>
                </label>
              </td>
              <td class="index-col">{{ pageStart + index + 1 }}</td>
              <td class="bold-person">{{ item.person }}</td>
              <td>{{ item.group }}</td>
              <td>{{ item.period }}</td>
              <td class="content-cell">{{ item.content }}</td>
              <td>
                <span :class="['status-tag', statusClass(item.status)]">
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.createTime || (item.date + ' 09:30:00') }}</td>
              <td class="action-col">
                <div class="row-actions">
                  <button type="button" class="text-action" @click="openViewDialog(item)">查看</button>
                  <button type="button" class="text-action" @click="openEditDialog(item)">修改</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="filteredRecords.length > 0">
        <span class="total-text">共 {{ filteredRecords.length }} 条</span>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <div v-if="dialogMode === 'view' && activeRecord" class="detail-box">
        <div class="detail-row">
          <span>日期</span>
          <strong>{{ activeRecord.date }}</strong>
        </div>
        <div class="detail-row">
          <span>时段</span>
          <strong>{{ activeRecord.period }}</strong>
        </div>
        <div class="detail-row">
          <span>小组</span>
          <strong>{{ activeRecord.group }}</strong>
        </div>
        <div class="detail-row">
          <span>人员</span>
          <strong>{{ activeRecord.person }}</strong>
        </div>
        <div class="detail-row detail-row--full">
          <span>排单内容</span>
          <strong>{{ activeRecord.content }}</strong>
        </div>
        <div class="detail-row">
          <span>状态</span>
          <strong>{{ activeRecord.status }}</strong>
        </div>
      </div>

      <el-form v-else :model="form" label-width="86px" class="styled-form">
        <div class="form-grid-row">
          <el-form-item label="日期">
            <!-- 修正2：弹窗里的日期只能是单日，绑定 form.date -->
            <input type="date" v-model="form.date" style="width: 100%; cursor: pointer;" />
          </el-form-item>
          <el-form-item label="时段">
            <el-radio-group v-model="form.period" class="deep-blue-radio">
              <el-radio-button label="上午" />
              <el-radio-button label="下午" />
            </el-radio-group>
          </el-form-item>
        </div>

        <div class="form-grid-row">
          <el-form-item label="小组">
            <el-select v-model="form.group" class="form-control">
              <el-option
                v-for="group in groupOptions"
                :key="group"
                :label="group"
                :value="group"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="人员">
            <input type="text" v-model="form.person" placeholder="填写人员姓名" style="width: 100%; box-sizing: border-box;" />
          </el-form-item>
        </div>

        <div class="form-section-title" style="margin-top: 20px;">
        </div>

        <el-form-item label="排单内容">
          <textarea
            v-model="form.content"
            rows="3"
            placeholder="例如：现场：武侯资本空气采样"
            class="custom-textarea"
          ></textarea>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" class="form-control">
            <el-option label="现场" value="现场" />
            <el-option label="内业" value="内业" />
            <el-option label="休假" value="休假" />
            <el-option label="外出" value="外出" />
            <el-option label="待安排" value="待安排" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ dialogMode === 'view' ? '返回' : '取消' }}
        </el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          class="primary-btn"
          @click="saveRecord"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      title="排单预览"
      width="88vw"
      top="5vh"
      class="schedule-preview-dialog"
    >
      <div class="preview-meta">
        <span>时间范围：{{ previewRangeLabel }}</span>
        <span>排单记录：{{ filteredRecords.length }} 条</span>
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
              <td
                v-if="row.groupRowspan"
                class="preview-group-col"
                :rowspan="row.groupRowspan"
              >
                {{ row.group }}
              </td>
              <td class="preview-owner-col">{{ row.owner }}</td>
              <td class="preview-person-col">{{ row.person }}</td>
              <template v-for="date in previewDates" :key="`${row.person}-${date}`">
                <td :class="['preview-cell', previewStatusClass(row.cells[date]?.morning?.status)]">
                  <template v-if="row.cells[date]?.morning">
                    <span class="preview-status">{{ row.cells[date].morning.status }}</span>
                    <span>{{ row.cells[date].morning.content }}</span>
                  </template>
                  <span v-else class="preview-empty">-</span>
                </td>
                <td :class="['preview-cell', previewStatusClass(row.cells[date]?.afternoon?.status)]">
                  <template v-if="row.cells[date]?.afternoon">
                    <span class="preview-status">{{ row.cells[date].afternoon.status }}</span>
                    <span>{{ row.cells[date].afternoon.content }}</span>
                  </template>
                  <span v-else class="preview-empty">-</span>
                </td>
              </template>
            </tr>

            <tr v-if="previewRows.length === 0">
              <td :colspan="previewEmptyColspan" class="empty-text">暂无排单预览</td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="preview-footer">
          <el-button type="primary" class="primary-btn" @click="exportPreviewExcel">
            导出
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  groupOptions,
  schedulingTemplateRows,
  templateEndDate,
  templateRecords,
  templateStartDate
} from './scheduleData'

defineOptions({ name: 'StaffScheduling' })

const records = ref([...templateRecords])
const keyword = ref('')

// 修正3：删除多余重复代码，仅保留一份
const dateRangeStart = ref('')
const dateRangeEnd = ref('')

const normalizedDateRange = computed(() => {
  if (!dateRangeStart.value || !dateRangeEnd.value) {
    return null
  }
  return dateRangeStart.value <= dateRangeEnd.value
    ? [dateRangeStart.value, dateRangeEnd.value]
    : [dateRangeEnd.value, dateRangeStart.value]
})

watch([dateRangeStart, dateRangeEnd], () => {
  currentPage.value = 1
})

const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const previewVisible = ref(false)
const dialogMode = ref('view')
const activeRecord = ref(null)
const form = ref(createEmptyForm())
let nextId = templateRecords.length + 1

const previewPeriods =[
  { key: 'morning', label: '上午' },
  { key: 'afternoon', label: '下午' }
]

const filteredRecords = computed(() => {
  const text = keyword.value.trim()
  const range = normalizedDateRange.value

  return records.value.filter((item) => {
    const matchesKeyword = !text ||[item.date, item.period, item.group, item.person, item.content, item.status]
      .join(' ')
      .includes(text)
    const matchesDate = !range || (item.date >= range[0] && item.date <= range[1])

    return matchesKeyword && matchesDate
  })
})

const pageStart = computed(() => (currentPage.value - 1) * pageSize.value)

const paginatedRecords = computed(() => {
  return filteredRecords.value.slice(pageStart.value, pageStart.value + pageSize.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pageSize.value) || 1
})

const filteredIds = computed(() => filteredRecords.value.map((item) => item.id))

const isAllSelected = computed(() => {
  return filteredIds.value.length > 0 && filteredIds.value.every((id) => selectedIds.value.includes(id))
})

const isIndeterminate = computed(() => {
  const count = filteredIds.value.filter((id) => selectedIds.value.includes(id)).length
  return count > 0 && count < filteredIds.value.length
})

const previewDates = computed(() => {
  const range = normalizedDateRange.value
  if (range) return createDateSeries(range[0], range[1])

  return createDateSeries(templateStartDate, templateEndDate)
})

const previewRows = computed(() => {
  const scheduleMap = createScheduleMap(filteredRecords.value)
  const templatePeople = new Set(schedulingTemplateRows.map((row) => row.person))
  const dynamicRows = filteredRecords.value
    .filter((record) => !templatePeople.has(record.person))
    .map((record) => ({ group: record.group, owner: '', person: record.person }))
  const sourceRows = dedupeTemplateRows([...schedulingTemplateRows, ...dynamicRows])

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

const dialogTitle = computed(() => {
  if (dialogMode.value === 'add') return '新增排单'
  if (dialogMode.value === 'edit') return '修改排单'
  return '排单详情'
})

watch(keyword, () => {
  currentPage.value = 1
})

watch(pageSize, () => {
  currentPage.value = 1
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value -= 1
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

function handleSizeChange() {
  currentPage.value = 1
}

function createEmptyForm() {
  return {
    id: null,
    date: '2025-11-01',
    period: '上午',
    group: '鉴定组',
    person: '',
    content: '',
    status: '现场'
  }
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...filteredIds.value]))
    return
  }

  selectedIds.value = selectedIds.value.filter((id) => !filteredIds.value.includes(id))
}

function toggleRow(id, checked) {
  if (checked) {
    selectedIds.value = Array.from(new Set([...selectedIds.value, id]))
    return
  }

  selectedIds.value = selectedIds.value.filter((item) => item !== id)
}

function openViewDialog(row) {
  activeRecord.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

function openAddDialog() {
  form.value = createEmptyForm()
  dialogMode.value = 'add'
  dialogVisible.value = true
}

function openPreviewDialog() {
  previewVisible.value = true
}

function openEditDialog(row) {
  form.value = { ...row }
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

function saveRecord() {
  if (!form.value.date || !form.value.person.trim() || !form.value.content.trim()) {
    ElMessage.warning('请填写日期、人员和排单内容')
    return
  }

  if (dialogMode.value === 'add') {
    records.value.unshift({
      ...form.value,
      id: nextId++,
      person: form.value.person.trim(),
      content: form.value.content.trim()
    })
    currentPage.value = 1
    ElMessage.success('新增成功')
  } else {
    const index = records.value.findIndex((item) => item.id === form.value.id)
    if (index !== -1) {
      records.value[index] = {
        ...form.value,
        person: form.value.person.trim(),
        content: form.value.content.trim()
      }
      ElMessage.success('修改成功')
    }
  }

  dialogVisible.value = false
}

function deleteSelected() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的记录')
    return
  }

  ElMessageBox.confirm(`确定删除已选择的 ${selectedIds.value.length} 条排单记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    records.value = records.value.filter((item) => !selectedIds.value.includes(item.id))
    selectedIds.value =[]
    if (paginatedRecords.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function deleteRow(row) {
  ElMessageBox.confirm(`确定删除「${row.person}」这条排单记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    records.value = records.value.filter((item) => item.id !== row.id)
    selectedIds.value = selectedIds.value.filter((id) => id !== row.id)
    if (paginatedRecords.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function statusClass(status) {
  if (status === '现场') return 'status-field'
  if (status === '内业') return 'status-office'
  if (status === '休假') return 'status-leave'
  if (status === '外出') return 'status-outside'
  return 'status-pending'
}

function previewStatusClass(status) {
  if (status === '现场') return 'preview-field'
  if (status === '内业') return 'preview-office'
  if (status === '休假') return 'preview-leave'
  if (status === '外出') return 'preview-outside'
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
  return['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(`${dateText}T00:00:00`).getDay()]
}

function exportPreviewExcel() {
  const title = `人员排单预览_${previewRangeLabel.value}`
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
    : `<tr><td colspan="${previewEmptyColspan.value}">暂无排单预览</td></tr>`

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

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h2 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-left: 4px solid #2a3f7a;
  padding-left: 12px;
  line-height: 1.1;
}

.preview-btn {
  flex: none;
  min-width: 104px;
}

.primary-btn {
  background-color: #2a3f7a !important;
  border-color: #2a3f7a !important;
  color: #ffffff !important;
}

.primary-btn:hover,
.primary-btn:focus {
  background-color: #3b5394 !important;
  border-color: #3b5394 !important;
}

.table-card {
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 22px 24px;
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-right {
  gap: 12px;
}

.date-range-picker {
  width: 300px;
}

.search-input {
  width: 280px;
}

.table-wrap {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  overflow-x: auto !important;
}
.schedule-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
  text-align: center;
  color: #606266;
  font-size: 14px;
  font-family: inherit;
  line-height: normal;
  table-layout: fixed;
}

.schedule-table th,
.schedule-table td {
  border-bottom: 1px solid #ebeef5;
  padding: 14px 10px;
  text-align: center;
}

.schedule-table th {
  color: #909399;
  font-weight: 500;
}

.schedule-table tbody tr:hover {
  background: #f5f7fa;
}

.check-col {
  width: 54px;
}

.index-col {
  width: 70px;
}

.content-col {
  width: 31%;
}

.content-cell {
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-col {
  width: 130px;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  white-space: nowrap;
}

.text-action {
  min-width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: #2a3f7a;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  line-height: normal;
}

.text-action:hover {
  color: #3b5394;
  text-decoration: underline;
}

.text-action--delete {
  color: #ff5f6d;
}

.text-action--delete:hover {
  color: #f56c6c;
}

.status-tag {
  display: inline-block;
  min-width: 54px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  border: 1px solid transparent;
}

.status-field {
  color: #2a3f7a;
  background: #eef4ff;
  border-color: #d7e3ff;
}

.status-office {
  color: #67c23a;
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.status-leave {
  color: #909399;
  background: #f4f4f5;
  border-color: #e9e9eb;
}

.status-outside {
  color: #e6a23c;
  background: #fdf6ec;
  border-color: #faecd8;
}

.status-pending {
  color: #909399;
  background: #ffffff;
  border-color: #dcdfe6;
}

.empty-text {
  height: 180px;
  color: #909399;
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  color: #606266;
  font-size: 13px;
}

.total-text {
  margin-right: 15px;
}

.page-select {
  height: 32px;
  padding: 2px 28px 2px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-right: 15px;
  color: #606266;
  background-color: #ffffff;
  font-size: 13px;
  outline: none;
}

.page-select:focus {
  border-color: #2a3f7a;
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
  width: 42px;
  height: 42px;
  border-radius: 4px;
  border: none;
  background-color: #f4f4f5;
  color: #1e293b;
  font-size: 16px;
  line-height: 1;
}

.pager-arrow {
  cursor: pointer;
}

.pager-arrow:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.pager-num.active {
  background-color: #2a3f7a;
  color: #ffffff;
  font-weight: 700;
}

/* ==========================================
   排单详情 (查看模式) 窗口美化
   ========================================== */
.detail-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px; /* 加大卡片间距，增加呼吸感 */
  padding: 10px 0;
}

.detail-row {
  background: #f8fafd;             /* 统一全局浅蓝灰底色 */
  border: 1px solid #dfe7f2;       /* 统一全局柔和边框 */
  border-radius: 10px;             /* 统一 10px 大圆角 */
  padding: 16px 20px;              /* 加大内边距，让内容不拥挤 */
  transition: all 0.3s ease;
}

/* 增加鼠标悬浮反馈，提升高级感 */
.detail-row:hover {
  background: #ffffff;
  border-color: #2a3f7a;           /* 悬浮时边框呈现华测深蓝色 */
  box-shadow: 0 6px 16px rgba(42, 63, 122, 0.06);
}

.detail-row--full {
  grid-column: 1 / -1;             /* 跨满整行 */
}

.detail-row span {
  display: block;
  margin-bottom: 8px;
  color: #6b7a99;                  /* 采用第六模块的标准标签灰色 */
  font-size: 13px;
  font-weight: 700;                /* 标签加粗提示 */
}

.detail-row strong {
  display: block;
  color: #1e293b;                  /* 主要文字颜色 */
  font-size: 15px;                 /* 内容字体稍微放大 */
  font-weight: 500;                /* 字体中等粗细，更加精致 */
  line-height: 1.5;
  word-break: break-word;          /* 防止长文本溢出卡片 */
}


.form-control {
  width: 100%;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner),
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #2a3f7a;
  border-color: #2a3f7a;
}

:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #2a3f7a;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #2a3f7a;
  border-color: #2a3f7a;
  box-shadow: -1px 0 0 0 #2a3f7a;
}

:deep(.schedule-preview-dialog .el-dialog__body) {
  padding-top: 8px;
}

.preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  color: #606266;
  font-size: 13px;
}

.excel-preview-wrap {
  max-height: 62vh;
  overflow: auto;
  border: 1px solid #dcdfe6;
  background: #ffffff;
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
  padding: 10px 12px;
  text-align: center;
  vertical-align: top;
}

.excel-preview-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #eef2ff;
  color: #2a3f7a;
  font-weight: 700;
}

.excel-preview-table thead tr:nth-child(2) th {
  top: 39px;
}

.excel-preview-table thead tr:nth-child(3) th {
  top: 78px;
}

.excel-preview-table .preview-group-col,
.excel-preview-table .preview-owner-col,
.excel-preview-table .preview-person-col {
  position: sticky;
  z-index: 3;
  min-width: 120px;
  background: #f8fafc;
  font-weight: 600;
}

.excel-preview-table .preview-group-col {
  left: 0;
}

.excel-preview-table .preview-owner-col {
  left: 120px;
}

.excel-preview-table .preview-person-col {
  left: 240px;
}

.excel-preview-table thead .preview-group-col,
.excel-preview-table thead .preview-owner-col,
.excel-preview-table thead .preview-person-col {
  z-index: 4;
  background: #e8edff;
}

.preview-cell {
  max-width: 220px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
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

.preview-field {
  background: #eef4ff;
  color: #2a3f7a;
}

.preview-office {
  background: #f0f9eb;
  color: #3f8f24;
}

.preview-leave {
  background: #f4f4f5;
  color: #606266;
}

.preview-outside {
  background: #fdf6ec;
  color: #b97916;
}

.preview-multiple {
  background: #fef0f0;
  color: #d93026;
}

.preview-blank {
  background: #ffffff;
  color: #909399;
}

.preview-empty {
  color: #c0c4cc;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .scheduling-module {
    padding: 14px;
  }

  .page-header,
  .table-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-right,
  .search-input,
  .date-range-picker {
    width: 100%;
  }

  .toolbar-right {
    align-items: stretch;
    flex-direction: column;
  }

  .preview-meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .excel-preview-table th,
  .excel-preview-table td {
    min-width: 128px;
  }
}

.el-table {
  font-size: 14px;
  color: #606266;
  --el-table-header-text-color: #909399;
}

:deep(.el-table .el-table__cell) {
  padding: 14px 10px !important;
}

:deep(.el-table th.el-table__cell) {
  font-weight: 500;
}

.cb-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
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
  transition: all 0.2s;
  position: relative;
}
.cb-wrap input:checked + .cb-icon {
  background: #2a3f7a;
  border-color: #2a3f7a;
}
.cb-wrap input:checked + .cb-icon::after {
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

:deep(.el-dialog__title) {
  font-size: 16px !important;
  color: #1e293b !important;
  font-weight: 600 !important;
  border-left: 4px solid #2a3f7a;
  padding-left: 10px;
  line-height: 1.1;
  display: inline-block;
}

:deep(.deep-blue-radio .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #2a3f7a !important;
  border-color: #2a3f7a !important;
  box-shadow: -1px 0 0 0 #2a3f7a !important;
  color: #ffffff !important;
}

:deep(.deep-blue-radio .el-radio-button__inner:hover) {
  color: #2a3f7a;
}

:deep(.el-dialog__footer) {
  padding: 15px 25px 20px;
  border-top: 1px solid #f0f2f5;
}

.scheduling-module {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.action-bar {
  display: flex; justify-content: space-between; align-items: center;
  background-color: #ffffff; padding: 16px 20px; border-radius: 4px;
  margin-bottom: 20px; border: 1px solid #ebeef5;
}

.bar-title {
  font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important;
  font-size: 20px; font-weight: bold; color: #2a3f7a;
  border-left: 4px solid #2a3f7a; padding-left: 12px; margin: 0; line-height: 1.2;
}

.bar-actions { display: flex; gap: 10px; align-items: center; }

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

.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  height: 38px !important;
  width: 100px !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  border: 1px solid transparent !important;
  font-family: inherit !important;
}

.btn-primary { background: #2a3f7a; color: #fff; border-color: #2a3f7a; }
.btn-primary:hover { background: #3e5a9e; }
.btn-danger { background: #f56c6c; color: #fff; border-color: #f56c6c; }
.btn-danger:hover { background: #f89898; }
.btn-default { background: #fff; color: #606266; border-color: #dcdfe6; }
.btn-default:hover { color: #2a3f7a; border-color: #2a3f7a; }

.table-wrapper {
  background-color: #ffffff; padding: 20px; border-radius: 4px; border: 1px solid #ebeef5;
}

table {
  width: 100% !important;
  border-collapse: collapse !important;
  text-align: center !important;
  font-size: 13px !important;
  color: #334155 !important;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}

th, td {
  padding: 14px 12px !important;
  border-bottom: 1px solid #edf2f7 !important;
  border-right: none !important;
  height: auto !important;
}

th {
  background: #f3f6fb !important;
  color: #2A3F7A !important;
  font-weight: bold !important;
  font-size: 13px !important;
  text-align: center !important;
  white-space: nowrap !important;
}

td {
  color: #334155 !important;
  font-size: 13px !important;
  text-align: center !important;
}
tbody tr:hover { background-color: #f5f7fa; }

.check-col { width: 40px; }
.index-col { width: 60px; }
.content-cell { text-align: left; }
.row-actions { display: flex; justify-content: center; gap: 15px; }

.text-action {
  border: none; background: transparent; color: #2a3f7a;
  font-size: 14px; font-weight: 400; cursor: pointer; padding: 0;
}
.text-action:hover { text-decoration: underline; opacity: 0.8; }
.text-action--delete { color: #f56c6c; }

.status-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.status-field { color: #2a3f7a; background: #eef4ff; }
.status-office { color: #67c23a; background: #f0f9eb; }
.status-leave { color: #909399; background: #f4f4f5; }
.status-outside { color: #e6a23c; background: #fdf6ec; }
.status-pending { color: #909399; background: #ffffff; border: 1px solid #dcdfe6; }

.pagination { display: flex; justify-content: flex-end; align-items: center; margin-top: 20px; font-size: 13px; color: #606266; }
.total-text { margin-right: 15px; }
.page-select { padding: 2px 5px; border: 1px solid #dcdfe6; border-radius: 4px; margin-right: 15px; color: #606266; height: 28px; outline: none; background: #fff; }
.pager-btns { display: flex; align-items: center; gap: 5px; }
.pager-arrow, .pager-num { display: inline-flex; justify-content: center; align-items: center; width: 28px; height: 28px; background-color: #f4f4f5; border-radius: 4px; cursor: pointer; font-size: 13px; color: #606266; }
.pager-arrow:hover:not(.disabled) { color: #2a3f7a; }
.pager-arrow.disabled { color: #c0c4cc; cursor: not-allowed; }
.pager-num.active { background-color: #2a3f7a; color: #fff; }

.table-wrapper {
  background-color: #ffffff !important;
  padding: 24px !important;
  border-radius: 18px !important;
  border: 1px solid #e3e9f3 !important;
  box-shadow: 0 10px 28px rgba(42, 63, 122, 0.07) !important;
}
table { width: 100% !important; border-collapse: collapse !important; font-size: 13px !important; color: #334155 !important; }
th { background: #f3f6fb !important; color: #2a3f7a !important; font-weight: 800 !important; padding: 14px !important; border-bottom: 1px solid #edf2f7 !important; }
td { padding: 14px !important; border-bottom: 1px solid #edf2f7 !important; text-align: center !important; }

/* 修正4：把组合输入框的样式收拢进来 */
.date-range-group {
  display: inline-flex;
  align-items: center;
  gap: 8px; /* 两个输入框与文字之间的间距 */
}

.range-input {
  width: 140px !important; /* 控制单个原生时间选择器的宽度 */
}

.range-separator {
  color: #6b7a99;
  font-size: 14px;
  font-weight: bold;
}
/* 对齐主题的自定义文本域 */
.custom-textarea {
  width: 100%;
  border: 1px solid #dfe7f2;
  border-radius: 10px;
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

/* ==========================================
   人员列加粗样式
   ========================================== */
.bold-person {
  font-weight: 700 !important;
  color: #2a3f7a !important;
}

</style>

<style>
:deep(.plain-text-select .el-select__wrapper) { flex-wrap: nowrap !important; overflow: hidden !important; }
:deep(.plain-text-select .el-tag) { background-color: transparent !important; border: none !important; color: #1e293b !important; padding: 0 !important; margin: 0 !important; max-width: none !important; }
:deep(.plain-text-select .el-tag__close) { display: none !important; }
:deep(.plain-text-select .el-tag:not(:last-of-type)::after) { content: '、'; color: #1e293b; }
:deep(.plain-text-select .el-select__input-wrapper) { display: none !important; }
</style>