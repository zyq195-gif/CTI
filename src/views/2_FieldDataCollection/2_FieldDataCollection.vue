<template>
  <div class="digital-record-page">

    <div class="action-bar">
      <div class="bar-title">数据采集</div>
      <div class="bar-actions" style="display: flex; gap: 10px;">
        <button type="button" class="btn btn-default" @click="resetForm">
          <i class="fa-solid fa-rotate-left"></i> 重置
        </button>
        <button type="button" class="btn btn-primary" @click="openGenerate">
          <i class="fa-solid fa-wand-magic-sparkles"></i> 生成技术方案
        </button>
      </div>
    </div>

    <div class="record-main-container">
      <div class="panel__title">数据采集各项信息</div>

        <div class="form-grid">
          <!-- 基础信息 -->
          <div class="field">
            <div class="label">客户名称</div>
            <input v-model="form.customerName" class="input" placeholder="请输入客户名称" />
          </div>
          <div class="field">
            <div class="label">联系人</div>
            <input v-model="form.contactPerson" class="input" placeholder="请输入联系人" />
          </div>
          <div class="field">
            <div class="label">联系电话</div>
            <input v-model="form.contactPhone" class="input" placeholder="请输入联系电话" />
          </div>
          <div class="field">
            <div class="label">邮箱</div>
            <input v-model="form.email" class="input" placeholder="请输入邮箱" />
          </div>
          <div class="field form-grid__full">
            <div class="label">项目地址</div>
            <input v-model="form.projectAddress" class="input" placeholder="请输入项目地址" />
          </div>
          <div class="field">
            <div class="label">预计进场日期</div>
            <div class="date-wrap">
              <input
                class="input date-display"
                :value="estimatedEntryDateText"
                placeholder="年/月/日"
                readonly
                tabindex="-1"
              />
              <button type="button" class="date-icon" @click="openDatePicker" aria-label="选择日期">
                <i class="fa-regular fa-calendar"></i>
              </button>
              <input
                ref="dateInputRef"
                v-model="form.estimatedEntryDate"
                type="date"
                class="date-native"
                @change="syncDateText"
              />
            </div>
          </div>

          <!-- 1 建筑构类型 -->
          <div class="section form-grid__full">
            <div class="section__title">1 建筑构类型</div>
            <div class="section__rows">
              <div class="row">
                <div class="row__label">结构形式</div>
                <div class="checks">
                  <label class="check"><input type="checkbox" v-model="form.structures.masonry" /> 砌体结构</label>
                  <label class="check"><input type="checkbox" v-model="form.structures.frame" /> 框架结构</label>
                  <label class="check"><input type="checkbox" v-model="form.structures.steel" /> 钢结构</label>
                  <label class="check"><input type="checkbox" v-model="form.structures.otherEnabled" /> 其他</label>
                  <input v-model="form.structures.otherText" class="input input--mini" :disabled="!form.structures.otherEnabled" placeholder="补充说明" />
                </div>
              </div>
              <div class="row">
                <div class="row__label">建筑类型</div>
                <div class="checks">
                  <label class="check"><input type="checkbox" v-model="form.buildingType.industrial" /> 工业建筑</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingType.civil" /> 民用建筑</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingType.structure" /> 构筑物</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingType.otherEnabled" /> 其他</label>
                  <input v-model="form.buildingType.otherText" class="input input--mini" :disabled="!form.buildingType.otherEnabled" placeholder="补充说明" />
                </div>
              </div>
              <div class="row">
                <div class="row__label">建筑用途</div>
                <div class="checks">
                  <label class="check"><input type="checkbox" v-model="form.buildingUsage.business" /> 经营</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingUsage.factory" /> 厂房</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingUsage.school" /> 学校</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingUsage.selfBuilt" /> 自建房</label>
                  <label class="check"><input type="checkbox" v-model="form.buildingUsage.otherEnabled" /> 其他</label>
                  <input v-model="form.buildingUsage.otherText" class="input input--mini" :disabled="!form.buildingUsage.otherEnabled" placeholder="补充说明" />
                </div>
              </div>
            </div>
          </div>

          <!-- 2 技术资料 -->
          <div class="section form-grid__full">
            <div class="section__title">2 可提供的技术资料</div>
            <div class="checks">
              <label class="check"><input type="checkbox" v-model="form.techDocs.structuralDrawing" /> 结施图</label>
              <label class="check"><input type="checkbox" v-model="form.techDocs.archDrawing" /> 建施图</label>
              <label class="check"><input type="checkbox" v-model="form.techDocs.noDrawing" /> 无图纸</label>
              <label class="check"><input type="checkbox" v-model="form.techDocs.sitePhotos" /> 现场照片</label>
              <label class="check"><input type="checkbox" v-model="form.techDocs.constructionProcess" /> 建筑施工过程资料</label>
              <label class="check"><input type="checkbox" v-model="form.techDocs.acceptance" /> 验收说明</label>
              <label class="check"><input type="checkbox" v-model="form.techDocs.otherEnabled" /> 其他</label>
              <input v-model="form.techDocs.otherText" class="input input--mini" :disabled="!form.techDocs.otherEnabled" placeholder="补充说明" />
            </div>
          </div>

          <!-- 3 报告用途 -->
          <div class="section form-grid__full">
            <div class="section__title">3 报告用途</div>
            <div class="checks">
              <label class="check"><input type="checkbox" v-model="form.reportUse.businessLicense" /> 办理营业执照</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.propertyCert" /> 办理产权证</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.retrofit" /> 加固改造</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.addEquipment" /> 增加设备</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.selfDecision" /> 自主</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.fullSurvey" /> 全面摸排</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.govRequirement" /> 主管部门要求</label>
              <label class="check"><input type="checkbox" v-model="form.reportUse.otherEnabled" /> 其他</label>
              <input v-model="form.reportUse.otherText" class="input input--mini" :disabled="!form.reportUse.otherEnabled" placeholder="补充说明" />
            </div>
          </div>

          <!-- 4 现场缺陷 -->
          <div class="section form-grid__full">
            <div class="section__title">4 现场缺陷</div>
            <div class="checks">
              <label class="check"><input type="checkbox" v-model="form.siteDefects.slabCrack" /> 楼板裂缝</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.wallCrack" /> 墙体裂缝</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.roofLeak" /> 屋面渗漏水</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.bearingDefect" /> 承重构件缺陷</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.corrosion" /> 构件锈蚀</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.foundationSettle" /> 基础沉降</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.apronCrack" /> 散水开裂</label>
              <label class="check"><input type="checkbox" v-model="form.siteDefects.otherEnabled" /> 其他</label>
              <input v-model="form.siteDefects.otherText" class="input input--mini" :disabled="!form.siteDefects.otherEnabled" placeholder="补充说明" />
            </div>
          </div>

          <!-- 5 现场概况 -->
          <div class="section form-grid__full">
            <div class="section__title">5 现场概况</div>
            <div class="section__rows">
              <div class="row">
                <div class="row__label">是否吊顶</div>
                <div class="inline">
                  <select v-model="form.siteOverview.hasCeiling" class="select">
                    <option value="">请选择</option>
                    <option value="yes">是</option>
                    <option value="no">否</option>
                  </select>
                  <span class="hint">（承重构件是否包封）</span>
                </div>
              </div>
              <div class="row">
                <div class="row__label">能否破拆作业</div>
                <select v-model="form.siteOverview.canChisel" class="select">
                  <option value="">请选择</option>
                  <option value="yes">是</option>
                  <option value="no">否</option>
                </select>
              </div>
              <div class="row">
                <div class="row__label">是否需要登高设备</div>
                <select v-model="form.siteOverview.needClimbEquipment" class="select">
                  <option value="">请选择</option>
                  <option value="yes">是</option>
                  <option value="no">否</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 6 建筑概况 -->
          <div class="section form-grid__full">
            <div class="section__title">6 建筑概况</div>
            <div class="section__rows section__rows--grid3">
              <div class="field">
                <div class="label">修建年代</div>
                <input v-model="form.buildingOverview.yearBuilt" class="input" placeholder="例如：2012" />
              </div>
              <div class="field">
                <div class="label">建筑层数</div>
                <input v-model="form.buildingOverview.floors" class="input" placeholder="例如：5" />
              </div>
              <div class="field">
                <div class="label">总建筑面积（㎡）</div>
                <input v-model="form.buildingOverview.area" class="input" placeholder="例如：3500" />
              </div>
            </div>
          </div>

          <!-- 7 报告类型 -->
          <div class="section form-grid__full">
            <div class="section__title">7 报告类型</div>
            <div class="section__rows">
              <div class="row">
                <div class="row__label">鉴定</div>
                <div class="checks">
                  <label class="check"><input type="checkbox" v-model="form.reportType.appraisalSafety" /> 既有建筑安全鉴定（安全+抗震）</label>
                  <label class="check"><input type="checkbox" v-model="form.reportType.appraisalArea" /> 区域鉴定（安全性）</label>
                </div>
              </div>
              <div class="row">
                <div class="row__label">评估</div>
                <div class="checks">
                  <label class="check"><input type="checkbox" v-model="form.reportType.assessmentCapacity" /> 承载能力评估</label>
                  <label class="check"><input type="checkbox" v-model="form.reportType.assessmentSafety" /> 安全性评估</label>
                </div>
              </div>
              <div class="row">
                <div class="row__label">其他</div>
                <input v-model="form.reportType.otherText" class="input" placeholder="（具体情况说明）" />
              </div>
            </div>
          </div>

          <!-- 8 建筑情况或现场照片 -->
          <div class="section form-grid__full">
            <div class="section__title">8 建筑情况或现场照片</div>
            <div class="upload-row">
              <button type="button" class="upload-btn" @click="photoInputRef?.click()">
                <i class="fa-solid fa-image"></i> 上传图片
              </button>
              <input
                ref="photoInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden-input"
                @change="onPhotoChange"
              />
              <div class="files" v-if="form.sitePhotos.length">
                <div v-for="(f, idx) in form.sitePhotos" :key="idx" class="file-pill">
                  {{ f.name }}
                  <button type="button" class="pill-x" @click="removePhoto(idx)">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              <div class="muted" v-else></div>
            </div>
          </div>

          <!-- 9 特殊要求 -->
          <div class="section form-grid__full">
            <div class="section__title">9 特殊要求</div>
            <div class="table">
              <div class="table__head">
                <div class="th">类别</div>
                <div class="th">说明</div>
                <div class="th th--op"></div>
              </div>
              <div class="table__row" v-for="(r, idx) in form.specialRequirements" :key="idx">
                <input v-model="r.category" class="input" placeholder="例如：工期/保密/入场要求" />
                <input v-model="r.description" class="input" placeholder="请输入说明" />
                <button type="button" class="link-danger" @click="removeRequirement(idx)">删除</button>
              </div>
              <button type="button" class="link-add" @click="addRequirement">
                <i class="fa-solid fa-plus"></i> 新增一条
              </button>
            </div>
          </div>

          <!-- 10 对我方入场要求及配合 -->
          <div class="section form-grid__full">
            <div class="section__title">10 对我方入场要求及配合</div>
            <div class="section__rows">
              <div class="row">
                <div class="row__label">检测人员入场安全培训</div>
                <select v-model="form.entryDocking.safetyTraining" class="select">
                  <option value="">请选择</option>
                  <option value="yes">是</option>
                  <option value="no">否</option>
                </select>
              </div>
              <div class="row">
                <div class="row__label">现场检测显示牌</div>
                <select v-model="form.entryDocking.displayBoard" class="select">
                  <option value="">请选择</option>
                  <option value="need">需要</option>
                  <option value="noneed">无需</option>
                </select>
              </div>
              <div class="row">
                <div class="row__label">个人劳保用品</div>
                <div class="checks checks--nowrap">
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.support.investigationSupplies" /> 勘察用品</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.support.helmet" /> 安全帽</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.support.reflectiveVest" /> 反光衣</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.support.goggles" /> 护目镜</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.support.otherEnabled" /> 其他</label>
                  <input v-model="form.entryDocking.support.otherText" class="input input--mini" :disabled="!form.entryDocking.support.otherEnabled" placeholder="补充说明" />
                </div>
              </div>
              <div class="row">
                <div class="row__label">甲方能否提供</div>
                <div class="checks checks--nowrap">
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.provide.climbStaff" /> 登高人员</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.provide.climbCar" /> 登高车</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.provide.assistantStaff" /> 检测辅助人员</label>
                  <label class="check"><input type="checkbox" v-model="form.entryDocking.provide.otherEnabled" /> 其他</label>
                  <input v-model="form.entryDocking.provide.otherText" class="input input--mini" :disabled="!form.entryDocking.provide.otherEnabled" placeholder="补充说明" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 咨询记录上传 -->
        <div class="consult-upload">
          <div class="consult-upload__label">咨询记录上传</div>
          <button type="button" class="plus-square" @click="consultInputRef?.click()" title="上传咨询记录（聊天记录）">
            <i class="fa-solid fa-plus"></i>
          </button>
          <input
            ref="consultInputRef"
            type="file"
            accept=".txt,.doc,.docx,.pdf,image/*"
            class="hidden-input"
            @change="onConsultChange"
          />
          <div class="muted" v-if="!form.consultFile"></div>
          <div class="file-pill" v-else>
            {{ form.consultFile.name }}
            <button type="button" class="pill-x" @click="form.consultFile = null">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
    </div>

    <!-- 弹窗（图一：命名与提示信息） -->
    <div class="modal-overlay" v-if="showModal" @click.self="closeGenerate">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">命名以及提示信息窗口</h3>
          <button class="btn-close" @click="closeGenerate">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-form">
            <div class="field">
              <div class="label">技术方案名称</div>
              <input v-model="planName" class="input" placeholder="例如：结构鉴定评估项目技术方案" />
            </div>
            <div class="tip-box">
              e.g. 请到技术方案管理页面进行查看与下载
            </div>
            <div class="modal-actions">
              <button type="button" class="ai-btn-new" @click="closeGenerate">取消</button>
              <button type="button" class="ai-btn-save" @click="confirmGenerate">确定生成</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

defineOptions({ name: 'FieldDataCollection' })

const photoInputRef = ref(null)
const consultInputRef = ref(null)
const dateInputRef = ref(null)

const showModal = ref(false)
const planName = ref('')
const estimatedEntryDateText = ref('')

const initialState = () => ({
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  email: '',
  projectAddress: '',
  estimatedEntryDate: '',

  structures: { masonry: false, frame: false, steel: false, otherEnabled: false, otherText: '' },
  buildingType: { industrial: false, civil: false, structure: false, otherEnabled: false, otherText: '' },
  buildingUsage: { business: false, factory: false, school: false, selfBuilt: false, otherEnabled: false, otherText: '' },

  techDocs: {
    structuralDrawing: false, archDrawing: false, noDrawing: false, sitePhotos: false,
    constructionProcess: false, acceptance: false, otherEnabled: false, otherText: ''
  },

  reportUse: {
    businessLicense: false, propertyCert: false, retrofit: false, addEquipment: false,
    selfDecision: false, fullSurvey: false, govRequirement: false, otherEnabled: false, otherText: ''
  },

  siteDefects: {
    slabCrack: false, wallCrack: false, roofLeak: false, bearingDefect: false,
    corrosion: false, foundationSettle: false, apronCrack: false, otherEnabled: false, otherText: ''
  },

  siteOverview: { hasCeiling: '', canChisel: '', needClimbEquipment: '' },
  buildingOverview: { yearBuilt: '', floors: '', area: '' },

  reportType: { appraisalSafety: false, appraisalArea: false, assessmentCapacity: false, assessmentSafety: false, otherText: '' },

  sitePhotos: [],
  specialRequirements: [{ category: '', description: '' }],

  entryDocking: {
    safetyTraining: '',
    displayBoard: '',
    support: { investigationSupplies: false, helmet: false, reflectiveVest: false, goggles: false, otherEnabled: false, otherText: '' },
    provide: { climbStaff: false, climbCar: false, assistantStaff: false, otherEnabled: false, otherText: '' },
  },

  consultFile: null,
})

const form = reactive(initialState())

function syncDateText() {
  const raw = String(form.estimatedEntryDate || '').trim()
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  estimatedEntryDateText.value = m ? `${m[1]}年${m[2]}月${m[3]}日` : ''
}

function openDatePicker() {
  const el = dateInputRef.value
  if (!el) return
  // Chromium 支持 showPicker()，可直接弹出原生日历
  if (typeof el.showPicker === 'function') {
    el.showPicker()
  } else {
    el.focus()
    el.click()
  }
}

watch(
  () => form.estimatedEntryDate,
  () => syncDateText(),
  { immediate: true }
)

function resetForm() {
  const fresh = initialState()
  Object.keys(fresh).forEach((k) => {
    // @ts-ignore
    form[k] = fresh[k]
  })
  planName.value = ''
  estimatedEntryDateText.value = ''
}

function onPhotoChange(e) {
  const files = Array.from(e?.target?.files || [])
  // @ts-ignore
  form.sitePhotos = [...form.sitePhotos, ...files]
  if (e?.target) e.target.value = ''
}

function removePhoto(idx) {
  // @ts-ignore
  form.sitePhotos.splice(idx, 1)
}

function addRequirement() {
  // @ts-ignore
  form.specialRequirements.push({ category: '', description: '' })
}

function removeRequirement(idx) {
  // @ts-ignore
  form.specialRequirements.splice(idx, 1)
  // @ts-ignore
  if (form.specialRequirements.length === 0) form.specialRequirements.push({ category: '', description: '' })
}

function onConsultChange(e) {
  const file = e?.target?.files?.[0] || null
  // @ts-ignore
  form.consultFile = file
  if (e?.target) e.target.value = ''
}

function openGenerate() {
  showModal.value = true
  if (!planName.value) planName.value = `结构鉴定评估技术方案_${new Date().toLocaleDateString()}`
}
function closeGenerate() { showModal.value = false }
function confirmGenerate() {
  const name = (planName.value || '').trim() || '未命名技术方案'
  window.alert(`已生成：「${name}」\n\n提示：请到技术方案管理页面进行查看与下载。`)
  showModal.value = false
}
</script>

<style scoped>

/* 稍微优化一下标题的间距，因为去掉了外层 padding */
.panel__title {
  font-size: 15px;
  font-weight: 700;
  color: #2a3f7a;
  letter-spacing: 0.5px;
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
}

.form-grid__full { grid-column: 1 / -1; }

.field .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.input, .select {
  width: 100%;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0 12px;
  background: #fff;
  color: #1e293b;
  outline: none;
  transition: box-shadow .2s, border-color .2s;
  font-size: 14px;
}

.input:focus, .select:focus {
  border-color: #2a3f7a;
  box-shadow: 0 0 0 3px rgba(42, 63, 122, 0.1);
}

.input:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.input--mini {
  height: 34px;
  max-width: 320px;
}

.date-wrap {
  position: relative;
}

.date-display {
  padding-right: 44px;
  pointer-events: none; /* 点击交给原生 date 输入框 */
}

.date-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 30px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 3;
}

.date-icon:hover {
  background: #f1f5f9;
  color: #2a3f7a;
}

.date-native {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 2;
}

.section {
  padding: 14px;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  background: #fbfdff;
}

.section__title {
  font-weight: 700;
  font-size: 13px;
  color: #2a3f7a;
  margin-bottom: 10px;
}

.section__rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section__rows--grid3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px 14px;
}

.row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  align-items: center;
}

.row__label {
  font-size: 13px;
  color: #334155;
  font-weight: 600;
}

.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
}

.checks--nowrap {
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px; /* 给滚动条留一点空间 */
}

.checks--nowrap .input--mini {
  flex: 0 0 auto;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
}

.inline {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.hint { font-size: 12px; color: #94a3b8; }

.upload-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  width: fit-content;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #2a3f7a;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.upload-btn:hover { background: #e2e8f0; }

.files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
}

.pill-x {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 2px;
}
.pill-x:hover { color: #f56c6c; }

.muted { color: #94a3b8; font-size: 12px; }
.hidden-input { display: none; }

.table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table__head, .table__row {
  display: grid;
  grid-template-columns: 240px 1fr 80px;
  gap: 10px;
  align-items: center;
}

.table__head {
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.th--op { text-align: right; }

.link-add {
  width: fit-content;
  border: none;
  background: transparent;
  color: #2a3f7a;
  cursor: pointer;
  font-weight: 700;
  padding: 6px 0;
}

.link-danger {
  border: none;
  background: transparent;
  color: #f56c6c;
  cursor: pointer;
  font-weight: 700;
  justify-self: end;
}

.consult-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #f0f2f5;
  flex-wrap: wrap;
}

.consult-upload__label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.plus-square {
  width: 44px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #2a3f7a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.plus-square:hover { background: #f1f5f9; }

/* 弹窗：沿用 AIChatService 的遮罩与卡片风格 */
.modal-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  width: 760px;
  max-width: 92%;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  animation: modal-pop 0.3s ease-out;
  overflow: hidden;
}

@keyframes modal-pop {
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.btn-close:hover { color: #f56c6c; }

.modal-body {
  padding: 22px 24px 24px;
  background: #f8fafc;
}

.modal-form {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-box {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  color: #334155;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

@media (max-width: 960px) {
  .form-grid { grid-template-columns: 1fr; }
  .row { grid-template-columns: 1fr; }
  .section__rows--grid3 { grid-template-columns: 1fr; }
  .table__head, .table__row { grid-template-columns: 1fr; }
  .th--op { text-align: left; }
  .link-danger { justify-self: start; }
}

/* ==========================================
   1. 顶部大标题 (数据采集)
   ========================================== */
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
/* ==========================================
   按钮组容器：确保内部所有按钮垂直居中
   ========================================== */
.bar-actions {
  display: flex !important;
  align-items: center !important; /* 👈 核心：强制所有子按钮在中轴线对齐 */
  gap: 10px !important;           /* 按钮之间的间距 */
  height: 100% !important;
}
/* ==========================================
   2. 表单区块小标题 (数据采集各项信息)
   ========================================== */
.panel__title {
  font-family: "Microsoft YaHei", "微软雅黑", sans-serif;
  font-size: 16px;
  font-weight: bold;
  color: #2a3f7a;
  border-left: 3px solid #2a3f7a; /* 稍微细一点的竖条，体现层级 */
  padding-left: 10px;
  letter-spacing: 0.5px;
  margin-bottom: 20px;
  line-height: 1.2;
}

</style>