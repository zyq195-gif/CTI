<template>
  <div class="quotation-container">
    <div v-if="!showForm" class="list-view">
      <div class="action-bar">
        <div class="bar-title">委托单管理</div>
        <div class="bar-actions">
          <input
            v-model.trim="searchText"
            type="text"
            class="keyword-input"
            placeholder="搜索编号、房屋名称、账户或受理人..."
            style="width: 300px;"
          />
          <button class="btn btn-primary" @click="handleAdd">
            <i class="fa-solid fa-plus"></i> 新增
          </button>
          <button class="btn btn-danger" @click="handleBatchDelete">
            <i class="fa-solid fa-trash"></i> 删除
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="quotation-table">
<thead>
            <tr>
              <th width="4%">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" v-model="isAllSelected">
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th width="5%">序号</th>
              <th width="12%">委托编号</th>
              <th width="15%">房屋名称</th>
              <th width="15%">房屋地址</th>
              <th width="8%">申请人</th>
              <th width="10%">咨询账户</th>
              <th width="6%">受理人</th>
              <th width="12%">委托日期</th>
              <th width="20%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in paginatedData" :key="item.id">
              <td>
                <label class="cb-wrap">
                  <input type="checkbox" v-model="selectedIds" :value="item.id">
                  <span class="cb-icon"></span>
                </label>
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td><span class="quote-no">{{ item.entrustNo }}</span></td>
              <td>{{ item.houseName }}</td>
              <td style="text-align: left;">{{ item.address }}</td>
              <td>{{ item.applicantName }}</td>
              <td>{{ item.consultingAccount }}</td>
              <td>{{ item.recipient }}</td>
              <td>{{ item.entrustDate }}</td>
              <td class="table-actions">
                <span class="action-link" @click="handleView(item)">查看</span>
                <span class="action-link" @click="handleEdit(item)">修改</span>
              </td>
            </tr>
            <tr v-if="filteredData.length === 0">
              <td colspan="10" class="empty-text">暂无符合条件的委托记录</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" v-if="filteredData.length > 0">
          <span class="total-text">共 {{ filteredData.length }} 条</span>
          <select class="page-select" v-model="pageSize">
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
          </select>
          <div class="pager-btns">
            <span class="pager-arrow" :class="{ disabled: currentPage === 1 }" @click="currentPage > 1 && currentPage--">&lt;</span>
            <span class="pager-num active">{{ currentPage }}</span>
            <span class="pager-arrow" :class="{ disabled: currentPage === totalPages }" @click="currentPage < totalPages && currentPage++">&gt;</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal-content form-modal">
        <div class="modal-header">
          <h3>{{ isEdit ? '编辑房屋安全评估委托单' : '新增房屋安全评估委托单' }}</h3>
          <button class="btn-close" @click="closeForm">×</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <div class="sec-title"><span class="sec-num">1</span> 房屋基本情况</div>
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label required">委托编号</label>
                <input class="form-input" v-model="form.entrustNo" placeholder="如: B04-2026-001">
              </div>
              <div class="form-item">
                <label class="form-label required">咨询账户</label>
                <input class="form-input" v-model="form.consultingAccount" placeholder="填写对应的咨询账户名称">
              </div>
              <div class="form-item full-width">
                <label class="form-label required">房屋名称</label>
                <input class="form-input" v-model="form.houseName" placeholder="请输入完整的房屋名称">
              </div>
              <div class="form-item full-width">
                <label class="form-label required">房屋地址</label>
                <input class="form-input" v-model="form.address" placeholder="详细至门牌号">
              </div>
              <div class="form-item">
                <label class="form-label">房屋所有人</label>
                <input class="form-input" v-model="form.owner" placeholder="所有人姓名/单位">
              </div>
              <div class="form-item">
                <label class="form-label">修建年代</label>
                <input class="form-input" v-model="form.buildYear" placeholder="如: 1998年">
              </div>
              <div class="form-item">
                <label class="form-label">建筑面积(㎡)</label>
                <input class="form-input" type="number" v-model="form.area" placeholder="平方米">
              </div>
              <div class="form-item">
                <label class="form-label">房屋类别</label>
                <select class="form-input" v-model="form.houseType">
                  <option value="城镇房屋">城镇房屋</option>
                  <option value="农房">农房</option>
                </select>
              </div>
              <div class="form-item">
                <label class="form-label">房屋用途</label>
                <input class="form-input" v-model="form.usage" placeholder="如: 住宅/办公/商业">
              </div>
              <div class="form-item">
                <label class="form-label">评估目的</label>
                <input class="form-input" v-model="form.purpose" placeholder="如: 安全排查/改变用途">
              </div>
              <div class="form-item">
                <label class="form-label">样品编号</label>
                <input class="form-input" v-model="form.sampleNo" placeholder="请输入样品编号">
              </div>
              <div class="form-item">
                <label class="form-label">报告编号</label>
                <input class="form-input" v-model="form.reportNo" placeholder="请输入报告编号">
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="sec-title"><span class="sec-num">2</span> 申请身份及证明材料</div>
            <div class="form-grid">
              <div class="form-item">
                <label class="form-label required">申请人姓名</label>
                <input class="form-input" v-model="form.applicantName" placeholder="所有人或委托人姓名">
              </div>
              <div class="form-item">
                <label class="form-label required">鉴定机构受理人</label>
                <input class="form-input" v-model="form.recipient" placeholder="填写受理人员姓名">
              </div>

              <div class="form-item">
                <label class="form-label">申请人身份</label>
                <div class="radio-group">
                  <label class="radio-item"><input type="radio" v-model="form.applicantType" value="所有人申请鉴定"> 所有人</label>
                  <label class="radio-item"><input type="radio" v-model="form.applicantType" value="委托人申请鉴定"> 委托人</label>
                </div>
              </div>
              <div class="form-item">
                <label class="form-label">产权情况</label>
                <div class="radio-group">
                  <label class="radio-item"><input type="radio" v-model="form.propertyStatus" value="房屋有产权"> 有产权</label>
                  <label class="radio-item"><input type="radio" v-model="form.propertyStatus" value="房屋无产权"> 无产权</label>
                </div>
              </div>

              <div class="form-item full-width">
                <label class="form-label required">附件材料清单及上传</label>
                <div class="materials-prompt-box">
                  <div class="prompt-title"><i class="fa-solid fa-circle-info"></i> 根据当前选择，您需要提供以下材料：</div>
                  <div class="prompt-content">{{ requiredMaterials }}</div>
                </div>

                <div class="upload-zone-wrapper">
                  <button class="btn-upload-local" @click="triggerLocalUpload">
                    <i class="fa-solid fa-folder-open"></i> 选择本地文件上传
                  </button>
                  <input type="file" ref="fileInputRef" multiple style="display: none" @change="onFileSelected" />

                  <div v-if="uploadedFiles.length > 0" class="upload-file-list">
                    <div v-for="(file, idx) in uploadedFiles" :key="idx" class="file-item-tag">
                      <i class="fa-regular fa-file-lines"></i>
                      <span class="f-name">{{ file.name }}</span>
                      <span class="f-size">({{ file.size }})</span>
                      <i class="fa-solid fa-circle-xmark remove-icon" @click="removeFile(idx)"></i>
                    </div>
                  </div>
                </div>

                <textarea class="custom-textarea" v-model="form.materials" rows="2" style="margin-top:10px;" placeholder="其他补充说明..."></textarea>
              </div>

              <div class="form-item">
                <label class="form-label">委托日期</label>
                <input class="form-input" type="date" v-model="form.entrustDate">
              </div>
            </div>
          </div>

          <div class="notice-info">
            <p><strong>说明：</strong></p>
            <p>1. 鉴定申请人对提供鉴定项目情况的真实性负责并签字确认；</p>
            <p>2. 鉴定机构受理人对鉴定申请人提供的资料等进行核对，同意接受委托后签字确认。</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeForm">取消</button>
          <button class="btn btn-primary" @click="handleSave">保存并确认委托</button>
        </div>
      </div>
    </div>

    <div v-if="showPreviewModal" class="preview-modal-overlay" @click.self="closePreviewModal">
      <div class="preview-modal-container" :class="{ 'is-fullscreen': isPreviewFullscreen }">
        <div class="preview-modal-header">
          <h3>委托单预览 - {{ currentPreviewItem?.entrustNo }}</h3>
          <div class="preview-header-actions">
            <button class="preview-icon-btn" @click="togglePreviewFullscreen" :title="isPreviewFullscreen ? '还原' : '最大化'">
              <i :class="isPreviewFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
            </button>
            <button class="preview-close-btn" @click="closePreviewModal" title="关闭">&times;</button>
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
          <button class="btn btn-primary" @click="downloadDoc">
            <i class="fa-solid fa-download" style="margin-right: 5px;"></i> 下载 Word 原件
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// ===== 数据准备 =====
const mockList = []
const accounts = ['核心账户A', '项目周转账户', '华测结算中心', '日常咨询账户']
const recipients = ['张工', '李主管', '王工程师', '陈工']

for (let i = 1; i <= 15; i++) {
  mockList.push({
    id: i,
    entrustNo: `B04-2026-0${String(i).padStart(2, '0')}`,
    houseName: i % 2 === 0 ? '成都市某高新产业园办公楼' : '锦江区住宅外立面评估',
    address: i % 2 === 0 ? '成都市汽车城大道333号' : '成都市锦江区东大街18号',
    owner: i % 2 === 0 ? '成都市投资集团' : '私人业主',
    buildYear: '2005年',
    area: 2500 + i * 150,
    houseType: '城镇房屋',
    usage: '办公/商业',
    purpose: '房屋安全评估',
    sampleNo: `YP-${202600 + i}`,
    reportNo: `REP-S-${202600 + i}`,
    applicantType: '所有人申请鉴定',
    propertyStatus: '房屋有产权',
    applicantName: '王经理',
    consultingAccount: accounts[i % 4],
    recipient: recipients[i % 4],
    entrustDate: `2026-05-${String(i).padStart(2, '0')}`,
    materials: '已提供房屋产权证明、所有人委托书。',
    attachments: [] // 模拟附件数据
  })
}

const tableData = ref(mockList)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref([])
const showForm = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const showPreviewModal = ref(false)
const isPreviewFullscreen = ref(false)
const currentPreviewItem = ref(null)
const previewUrl = ref('')

// 上传相关变量
const fileInputRef = ref(null)
const uploadedFiles = ref([])

const form = ref({
  entrustNo: '', consultingAccount: '', houseName: '', address: '', owner: '',
  buildYear: '', area: '', houseType: '城镇房屋', usage: '', purpose: '',
  sampleNo: '', reportNo: '', applicantType: '所有人申请鉴定',
  propertyStatus: '房屋有产权', applicantName: '', recipient: '',
  entrustDate: '', materials: ''
})

// 👈 核心：根据图片模板逻辑动态生成材料清单提示
const requiredMaterials = computed(() => {
  const isOwner = form.value.applicantType === '所有人申请鉴定';
  const hasProperty = form.value.propertyStatus === '房屋有产权';

  if (isOwner) {
    return hasProperty
      ? '房屋产权证明文件（包括房产证、不动产登记证、房屋所有权证等）。'
      : '1. 政府批复文件（如用地规划批准材料、建设工程规划批准材料、竣工验收备案材料等）；2. 司法判决材料；3. 其他证明材料。';
  } else {
    return hasProperty
      ? '1. 房屋所有人同意鉴定委托书；2. 房屋产权证明文件（包括房产证、不动产登记证、房屋所有权证等）。'
      : '1. 房屋所有人同意鉴定委托书；2. 政府批复文件（如用地规划批准材料等）；3. 司法判决材料；4. 其他证明材料。';
  }
});

// ===== 上传接口方法 =====
const triggerLocalUpload = () => fileInputRef.value.click();

const onFileSelected = (event) => {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    uploadedFiles.value.push({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB'
    });
  });
  event.target.value = ''; // 清空选择框以便重复选择
};

const removeFile = (index) => uploadedFiles.value.splice(index, 1);

// ===== 其余逻辑保持不变 =====
const filteredData = computed(() => {
  if (!searchText.value) return tableData.value
  const kw = searchText.value.toLowerCase()
  return tableData.value.filter(item =>
    item.entrustNo.toLowerCase().includes(kw) ||
    item.houseName.toLowerCase().includes(kw) ||
    (item.consultingAccount && item.consultingAccount.toLowerCase().includes(kw)) ||
    (item.recipient && item.recipient.toLowerCase().includes(kw))
  )
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value) || 1)

const isAllSelected = computed({
  get: () => paginatedData.value.length > 0 && paginatedData.value.every(i => selectedIds.value.includes(i.id)),
  set: (val) => { selectedIds.value = val ? paginatedData.value.map(i => i.id) : [] }
})

watch(searchText, () => { currentPage.value = 1 })

const handleAdd = () => {
  isEdit.value = false; uploadedFiles.value = [];
  form.value = {
    entrustNo: 'B04-2026-' + Date.now().toString().slice(-3),
    houseType: '城镇房屋', applicantType: '所有人申请鉴定', propertyStatus: '房屋有产权',
    entrustDate: new Date().toISOString().split('T')[0]
  }
  showForm.value = true
}

const handleEdit = (row) => {
  isEdit.value = true; editingId.value = row.id;
  form.value = { ...row };
  uploadedFiles.value = row.attachments || []; // 加载已有附件
  showForm.value = true
}

const handleSave = () => {
  if (!form.value.entrustNo || !form.value.houseName || !form.value.recipient) return alert('请填写必要项')
  const data = { ...form.value, attachments: [...uploadedFiles.value] };
  if (isEdit.value) {
    const idx = tableData.value.findIndex(i => i.id === editingId.value)
    if (idx !== -1) tableData.value[idx] = { ...data, id: editingId.value }
    alert('修改成功！')
  } else {
    tableData.value.unshift({ ...data, id: Date.now() })
    alert('新增成功！')
  }
  closeForm()
}

const handleView = (row) => {
  currentPreviewItem.value = { ...row }
  showPreviewModal.value = true
  previewUrl.value = encodeURI('/huace/委托单模板.pdf')
};

const closeForm = () => { showForm.value = false; editingId.value = null; }
const closePreviewModal = () => { showPreviewModal.value = false; currentPreviewItem.value = null; }
const togglePreviewFullscreen = () => { isPreviewFullscreen.value = !isPreviewFullscreen.value }

const downloadDoc = () => {
  const link = document.createElement('a')
  link.href = encodeURI('/huace/委托单模板.doc')
  link.download = `委托单_${currentPreviewItem.value.entrustNo}.doc`
  link.click()
}

const handleBatchDelete = () => {
  if (!selectedIds.value.length) return alert('请选择项')
  if (confirm('确认删除选中记录？')) {
    tableData.value = tableData.value.filter(i => !selectedIds.value.includes(i.id))
    selectedIds.value = []
  }
}
</script>

<style scoped>
.quotation-container { padding: 20px; background-color: #f5f7fa; min-height: calc(100vh - 60px); }

.action-bar {
  display: flex; justify-content: space-between; align-items: center;
  background-color: #ffffff; padding: 16px 24px; border-radius: 18px;
  margin-bottom: 20px; border: 1px solid #e3e9f3;
  box-shadow: 0 10px 28px rgba(42, 63, 122, 0.07);
}

.bar-title {
  font-size: 20px; font-weight: bold; color: #2a3f7a;
  border-left: 4px solid #2a3f7a; padding-left: 12px; line-height: 1.2;
}

.bar-actions { display: flex; gap: 12px; align-items: center; }

.keyword-input {
  height: 38px !important; border: 1px solid #dfe7f2 !important; border-radius: 10px !important;
  padding: 0 12px !important; font-size: 14px !important; outline: none !important;
  background-color: #f8fafd !important; transition: all 0.2s !important;
}
.keyword-input:focus { border-color: #2a3f7a !important; background-color: #fff !important; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 38px !important; padding: 0 18px !important; border-radius: 10px !important;
  cursor: pointer; transition: all 0.2s; border: 1px solid transparent; font-weight: 700;
}
.btn-primary { background: #2a3f7a; color: #fff; }
.btn-danger { background: #f56c6c; color: #fff; }

.table-wrapper {
  background-color: #ffffff; padding: 24px; border-radius: 18px;
  border: 1px solid #e3e9f3; box-shadow: 0 10px 28px rgba(42, 63, 122, 0.07);
}

.quotation-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 13px; color: #334155; }
.quotation-table th, .quotation-table td { padding: 14px 12px; border-bottom: 1px solid #edf2f7; }
.quotation-table th { background: #f3f6fb; color: #2a3f7a; font-weight: 800; }

.quote-no { color: #2a3f7a; font-weight: 700; }
.action-link { color: #2a3f7a; cursor: pointer; font-weight: 700; margin: 0 8px; }
.action-link:hover { text-decoration: underline; }

.pagination { display: flex; justify-content: flex-end; align-items: center; margin-top: 20px; font-size: 13px; color: #606266; }
.page-select { height: 28px; border: 1px solid #dcdfe6; border-radius: 4px; margin: 0 15px; }
.pager-btns { display: flex; gap: 5px; }
.pager-arrow, .pager-num { display: inline-flex; justify-content: center; align-items: center; width: 28px; height: 28px; background-color: #f4f4f5; border-radius: 4px; cursor: pointer; }
.pager-num.active { background-color: #2a3f7a; color: #fff; }

/* 弹窗与表单样式 */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: 3000; display: flex; align-items: center; justify-content: center; }
.modal-content { background: #fff; border-radius: 18px; width: 950px; max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 70px rgba(0,0,0,0.2); }
.modal-header { padding: 22px 26px; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { border-left: 4px solid #2a3f7a; padding-left: 10px; color: #2a3f7a; font-size: 18px; font-weight: 800; }
.btn-close { background: none; border: none; font-size: 24px; color: #909399; cursor: pointer; }

.modal-body { padding: 26px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px; background: #f8fafc; }
.form-section { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #ebeef5; }
.sec-title { font-weight: 800; color: #2a3f7a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.sec-num { background: #2a3f7a; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }

.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.form-item { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: bold; color: #6b7a99; }
.required::after { content: ' *'; color: #f56c6c; }
.form-input { padding: 10px 12px; border: 1px solid #dfe7f2; border-radius: 10px; background: #f8fafd; outline: none; font-size: 14px; }
.form-input:focus { border-color: #2a3f7a; background: #fff; }
.full-width { grid-column: span 2; }
.custom-textarea { width: 100%; border: 1px solid #dfe7f2; border-radius: 10px; padding: 12px; background: #f8fafd; outline: none; resize: none; font-family: inherit; }

.radio-group { display: flex; gap: 20px; padding: 8px 0; }
.radio-item { font-size: 14px; color: #1e293b; cursor: pointer; display: flex; align-items: center; gap: 5px; }

/* 👈 动态提示框样式 */
.materials-prompt-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px 16px; margin-bottom: 12px; }
.prompt-title { color: #0369a1; font-size: 13px; font-weight: bold; margin-bottom: 6px; }
.prompt-content { color: #0c4a6e; font-size: 13px; line-height: 1.5; }

/* 👈 本地上传区域样式 */
.upload-zone-wrapper { display: flex; flex-direction: column; gap: 10px; }
.btn-upload-local { background: #fff; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 10px; color: #475569; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.btn-upload-local:hover { border-color: #2a3f7a; color: #2a3f7a; background: #f8fafc; }
.upload-file-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px; }
.file-item-tag { display: inline-flex; align-items: center; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 12px; color: #334155; border: 1px solid #e2e8f0; }
.file-item-tag i { margin-right: 6px; color: #64748b; }
.file-item-tag .f-name { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-item-tag .f-size { color: #94a3b8; margin-left: 4px; }
.remove-icon { cursor: pointer; color: #94a3b8 !important; margin-left: 8px !important; margin-right: 0 !important; }
.remove-icon:hover { color: #f56c6c !important; }

.notice-info { padding: 15px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; font-size: 13px; color: #92400e; line-height: 1.6; }

.modal-footer { padding: 18px 26px; border-top: 1px solid #edf2f7; display: flex; justify-content: flex-end; gap: 12px; }

/* 预览相关 */
.preview-modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 4000; }
.preview-modal-container { background-color: #ffffff; width: 950px; height: 85vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.preview-modal-container.is-fullscreen { width: 100vw; height: 100vh; border-radius: 0; }
.preview-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f8f9fa; border-bottom: 1px solid #ebeef5; }
.preview-header-actions { display: flex; gap: 16px; }
.preview-icon-btn, .preview-close-btn { background: none; border: none; color: #909399; cursor: pointer; font-size: 18px; }
.preview-modal-body { flex: 1; background-color: #525659; }
.preview-modal-footer { padding: 12px 20px; border-top: 1px solid #ebeef5; display: flex; justify-content: flex-end; }
</style>