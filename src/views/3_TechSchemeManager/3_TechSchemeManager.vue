<template>
  <div class="tech-scheme-page">

    <div class="action-bar">
      <div class="bar-title">技术方案管理</div>
      <div class="bar-actions" style="display: flex; gap: 10px; align-items: center;">
        <input v-model.trim="searchText" type="text" class="keyword-input search-box" placeholder="搜索委托单编号、方案编号或标题..."
          style="width: 240px; display: block !important;" />
        <button class="btn btn-primary" @click="openAddPanel">
          <i class="fa-solid fa-plus"></i> 新增
        </button>
        <button class="btn btn-danger" @click="handleBatchDelete">
          <i class="fa-solid fa-trash" style="margin-right: 4px;"></i> 删除
        </button>
      </div>
    </div>

    <div class="record-main-container">
      <div class="panel__title">技术方案列表</div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-check">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll(($event.target).checked)" />
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th class="col-index">序号</th>
              <th width="120">委托单编号</th>
              <th>方案编号</th>
              <th>方案名称</th>
              <th>工程名称</th>
              <th>鉴定类型</th>
              <th>编写人</th>
              <th>更新时间</th>
              <th class="col-action">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pageRows.length === 0">
              <td colspan="10" class="empty-cell">{{ emptyText }}</td>
            </tr>
            <tr v-for="(item, index) in pageRows" :key="item.id">
              <td class="col-check">
                <label class="cb-wrap" style="margin: 0; display: inline-flex; justify-content: center;">
                  <input type="checkbox" v-model="selectedIds" :value="item.id" />
                  <span class="cb-icon"></span>
                </label>
              </td>
              <td class="col-index">{{ (pagination.page - 1) * pagination.pageSize + index + 1 }}</td>
              <td class="order-no-text">{{ item.entrustNo }}</td>
              <td class="bold-scheme">{{ item.schemeNo }}</td>
              <td> {{ item.schemeName }}</td>
              <td>{{ item.projectName }}</td>
              <td>{{ item.appraisalType }}</td>
              <td>{{ item.writer }}</td>
              <td>{{ item.updateTime }}</td>
              <td class="col-action">
                <div class="row-actions">
                  <button class="text-btn" type="button" @click="openPreview(item)">查看</button>
                  <button class="text-btn" type="button" @click="openEditPanel(item)">修改</button>
                  <button class="icon-action" type="button" title="重新生成技术方案" :disabled="regeneratingId === item.id"
                    @click="handleRegenerate(item)">
                    <i class="fa-solid fa-rotate-right" :class="{ spinning: regeneratingId === item.id }"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination" v-if="filteredRows.length > 0">
        <span class="total-text">共 {{ filteredRows.length }} 条</span>
        <select class="page-select" v-model="pagination.pageSize" @change="pagination.page = 1">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="30">30条/页</option>
        </select>
        <div class="pager-btns">
          <span class="pager-arrow" :class="{ disabled: pagination.page === 1 }" @click="prevPage">&lt;</span>
          <span class="pager-num active">{{ pagination.page }}</span>
          <span class="pager-arrow" :class="{ disabled: pagination.page === totalPages }" @click="nextPage">&gt;</span>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showEditor" class="modal-overlay" @click="closeEditor">
        <div class="edit-modal" @click.stop>
          <div class="modal-header">
            <h3>{{ isEditMode ? '编辑技术方案' : '新增技术方案' }}</h3>
            <button class="modal-close" type="button" @click="closeEditor">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body">
            <section class="form-card">
              <h4>基础信息</h4>
              <div class="grid-two">
                <label class="field" style="grid-column: span 2;">
                  <span>委托单编号</span>
                  <div class="input-with-btn">
                    <input v-model.trim="formModel.entrustNo" type="text" readonly
                      style="color: #2a3f7a; font-weight: bold; cursor: pointer; background: #f8fafc;"
                      @click="openOrderSelector" />
                    <button class="btn btn-primary select-btn" type="button" @click="openOrderSelector">选择</button>
                  </div>
                </label>
                <label class="field"><span>方案名称</span><input v-model.trim="formModel.schemeName" type="text" /></label>
                <label class="field"><span>方案编号</span><input v-model.trim="formModel.schemeNo" type="text" /></label>
                <label class="field"><span>工程名称</span><input v-model.trim="formModel.projectName" type="text" /></label>
                <label class="field"><span>委托单位</span><input v-model.trim="formModel.clientName" type="text" /></label>
                <label class="field"><span>工程地点</span><input v-model.trim="formModel.projectAddress"
                    type="text" /></label>
                <label class="field"><span>鉴定类型</span><input v-model.trim="formModel.appraisalType"
                    type="text" /></label>
                <label class="field"><span>编写人</span><input v-model.trim="formModel.writer" type="text" /></label>
                <label class="field"><span>校核人</span><input v-model.trim="formModel.reviewer" type="text" /></label>
                <label class="field"><span>批准人</span><input v-model.trim="formModel.approver" type="text" /></label>
                <label class="field"><span>日期</span><input v-model="formModel.createDate" type="date" /></label>
              </div>
            </section>

            <section class="form-card">
              <h4>方案正文</h4>
              <div class="grid-one body-fields">
                <label class="field"><span>工程概况</span><textarea v-model.trim="formModel.overview"
                    rows="4"></textarea></label>
                <label class="field"><span>鉴定目的及范围</span><textarea v-model.trim="formModel.purposeScope"
                    rows="4"></textarea></label>
                <label class="field"><span>检测鉴定依据</span><textarea v-model.trim="formModel.basis"
                    rows="4"></textarea></label>
                <label class="field"><span>检测数量</span><textarea v-model.trim="formModel.quantity"
                    rows="3"></textarea></label>
                <label class="field"><span>检测鉴定仪器设备</span><textarea v-model.trim="formModel.equipment"
                    rows="3"></textarea></label>
                <label class="field"><span>检测鉴定技术方法</span><textarea v-model.trim="formModel.method"
                    rows="4"></textarea></label>
                <label class="field"><span>鉴定报告编写</span><textarea v-model.trim="formModel.reportWriting"
                    rows="4"></textarea></label>
                <label class="field"><span>鉴定及检测质量保证措施</span><textarea v-model.trim="formModel.qualityMeasure"
                    rows="4"></textarea></label>
                <label class="field"><span>安全作业保证措施</span><textarea v-model.trim="formModel.safetyMeasure"
                    rows="4"></textarea></label>
                <label class="field"><span>需委托方配合事项及要求</span><textarea v-model.trim="formModel.cooperation"
                    rows="4"></textarea></label>
              </div>
            </section>
          </div>

          <div class="modal-footer">
            <button class="btn btn-default" type="button" @click="closeEditor">取消</button>
            <button class="btn btn-primary" type="button" @click="saveScheme">保存</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="previewScheme" class="modal-overlay" @click="closePreview">
        <div class="preview-modal" @click.stop>
          <div class="modal-header">
            <h3>文档预览</h3>
            <button class="modal-close" type="button" @click="closePreview">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body preview-body">
            <div class="document-paper">
              <section class="cover-section">
                <p class="cover-label">检测方案</p>
                <h1>{{ previewScheme.schemeName }}</h1>
                <p><strong>方案编号：</strong>{{ previewScheme.schemeNo }}</p>
                <p><strong>编写：</strong>{{ previewScheme.writer }}　<strong>校核：</strong>{{ previewScheme.reviewer
                }}　<strong>批准：</strong>{{ previewScheme.approver }}</p>
                <p><strong>公司名称：</strong>{{ previewScheme.clientName }}</p>
                <p><strong>日期：</strong>{{ previewScheme.createDate }}</p>
              </section>

              <section v-for="section in docSections" :key="section.key" class="doc-section">
                <h2>{{ section.title }}</h2>
                <p>{{ previewScheme[section.key] }}</p>
              </section>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-default" type="button" @click="closePreview">关闭</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
  <!-- 委托单选择弹窗 -->
  <transition name="fade">
    <div v-if="showOrderSelectModal" class="modal-overlay" style="z-index: 4000;" @click="closeOrderSelector">
      <div class="edit-modal" style="width: 800px; height: 60vh;" @click.stop>
        <div class="modal-header">
          <h3>选择委托单</h3>
          <button class="modal-close" @click="closeOrderSelector"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <!-- 搜索框 -->
          <input v-model="orderSearchText" class="keyword-input" placeholder="搜索委托单编号、工程名称或单位..."
            style="width: 100%; display: block;" />

          <!-- 删除了外层的 div 布局框，直接给 table 添加类名以绑定全包围边框样式 -->
          <table class="order-select-table">
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
                <td style="color: #2a3f7a; font-weight: bold;">{{ order.orderNo }}</td>
                <td>{{ order.projectName }}</td>
                <td>{{ order.clientName }}</td>
                <td>
                  <button class="text-btn" @click="selectOrderForScheme(order)" style="padding: 0;">选择</button>
                </td>
              </tr>
              <tr v-if="filteredOrders.length === 0">
                <td colspan="4" style="padding: 40px 0; color: #909399;">未搜索到相关委托单</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

defineOptions({ name: 'TechSchemeManager' })

// ======================= 数据源配置 =======================
const docSections = [
  { key: 'overview', title: '1. 工程概况' },
  { key: 'purposeScope', title: '2. 鉴定目的及范围' },
  { key: 'basis', title: '3. 检测鉴定依据' },
  { key: 'quantity', title: '4. 检测数量' },
  { key: 'equipment', title: '5. 检测鉴定仪器设备' },
  { key: 'method', title: '6. 检测鉴定技术方法' },
  { key: 'reportWriting', title: '7. 鉴定报告编写' },
  { key: 'qualityMeasure', title: '8. 鉴定及检测质量保证措施' },
  { key: 'safetyMeasure', title: '9. 安全作业保证措施' },
  { key: 'cooperation', title: '10. 需委托方配合事项及要求' }
]

const templateContent = {
  overview: '本工程为既有建筑改造项目，需对主体结构现状进行检测与安全性评估，明确后续加固与使用条件。',
  purposeScope: '通过现场检测和资料核查，评估结构安全性与适用性；范围涵盖主要承重构件、重点功能区域及典型病害部位。',
  basis: '依据《民用建筑可靠性鉴定标准》GB 50292、《建筑抗震鉴定标准》GB 50023及相关委托技术要求。',
  quantity: '按抽样检测原则完成构件抽检、病害复核和必要复测，形成可追溯检测台账。',
  equipment: '回弹仪、钢筋扫描仪、裂缝测宽仪、全站仪及其他经检定合格的配套设备。',
  method: '采用“资料审查 + 现场普查 + 重点抽检 + 综合分析”方法，确保结论完整、准确、可复核。',
  reportWriting: '报告按“工程概况、检测结果、分析评价、结论建议”结构编写，附检测记录与图像资料。',
  qualityMeasure: '建立分级审核机制，关键数据双人复核，检测过程与成果文件统一归档。',
  safetyMeasure: '落实现场安全技术交底，严格执行用电、高处及临边作业管理要求。',
  cooperation: '需委托方提供结构图纸及历史资料，配合现场封闭、检测通行和作业时段协调。'
}

const initialSchemes = [
  {
    id: 1,
    entrustNo: 'WT-2026-001',
    schemeNo: 'JSFA-2026-001',
    schemeName: 'XXX安全性及抗震鉴定方案',
    projectName: 'XXX综合体改造项目',
    appraisalType: '安全性及抗震鉴定',
    writer: '王工',
    reviewer: '李工',
    approver: '张总工',
    createDate: '2026-04-10',
    date: '2026-04-10',
    updateTime: '2026-05-05 09:20:12',
    clientName: '华测工程咨询有限公司',
    projectAddress: '上海市浦东新区示范路88号',
    overview: '项目主体为地上18层框架-剪力墙结构，改造前需核验结构承载能力及抗震构造措施。',
    purposeScope: '完成主要构件安全性与抗震性能复核，范围覆盖地上主体、地下室关键区域及连接节点。',
    basis: '依据 GB 50292、GB 50023 及项目现有竣工资料和现场踏勘记录。',
    quantity: '抽检柱 28 根、梁 36 根、板 18 跨，专项复核抗震薄弱部位 12 处。',
    equipment: '回弹仪、钢筋扫描仪、超声检测仪、全站仪。',
    method: '采用普查与重点抽检结合方式，针对疑似风险点实施复测与对比分析。',
    reportWriting: '按章节输出检测结果、验算结论与处理建议，附关键点位图与原始记录。',
    qualityMeasure: '实行数据复核和负责人审签制度，确保检测结论一致、可追踪。',
    safetyMeasure: '执行现场分区作业与人员防护制度，明确高风险区域管控措施。',
    cooperation: '需委托方提供完整历史资料并协调现场封闭及检测通道。'
  },
  {
    id: 2,
    entrustNo: 'WT-2026-002',
    schemeNo: 'JSFA-2026-002',
    schemeName: '地下室结构安全性鉴定方案',
    projectName: '某商业中心地下空间工程',
    appraisalType: '结构安全性鉴定',
    writer: '赵工',
    reviewer: '何工',
    approver: '张总工',
    createDate: '2026-03-27',
    date: '2026-03-27',
    updateTime: '2026-05-03 15:42:20',
    clientName: '华测工程咨询有限公司',
    projectAddress: '苏州市工业园区金鸡湖大道369号',
    overview: '地下室包含 B1-B3 三层，存在局部渗漏与构件表观病害，需开展专项检测。',
    purposeScope: '明确地下结构耐久性与承载风险，覆盖顶板、柱网节点与外墙重点区域。',
    basis: '依据 GB/T 50784 及地下结构相关检测规范。',
    quantity: '柱构件抽检 22 根、板面测区 40 处、渗漏点位 15 处。',
    equipment: '回弹仪、碳化深度测定仪、钢筋锈蚀仪、激光测距仪。',
    method: '分区分层实施检测，结合病害等级评定形成综合鉴定意见。',
    reportWriting: '形成地下结构分层报告，附病害分布及检测数据汇总表。',
    qualityMeasure: '关键检测项实行双设备比对，异常数据必须复测确认。',
    safetyMeasure: '强化地下空间通风照明管理，落实有限空间作业防护。',
    cooperation: '需委托方配合提供施工记录并安排非营业时段检测。'
  },
  {
    id: 3,
    entrustNo: 'WT-2026-003',
    schemeNo: 'JSFA-2026-003',
    schemeName: '厂房结构检测鉴定方案',
    projectName: '某制造基地扩建工程',
    appraisalType: '工业厂房可靠性鉴定',
    writer: '陈工',
    reviewer: '钱工',
    approver: '周总工',
    createDate: '2026-04-05',
    date: '2026-04-05',
    updateTime: '2026-04-28 10:16:35',
    clientName: '华测工程咨询有限公司',
    projectAddress: '无锡市新吴区高新路66号',
    overview: '厂房为单层框架结构，拟进行产线升级，需评估现有结构可靠性。',
    purposeScope: '围绕主要承重体系和吊车梁系统开展检测与可靠性分析。',
    basis: '依据《工业建筑可靠性鉴定标准》及企业改造技术要求。',
    quantity: '主构件抽检 35 个，沉降点 24 个，裂缝复核 30 处。',
    equipment: '全站仪、水准仪、裂缝测宽仪、钢筋扫描仪。',
    method: '结合现场检测和运行工况复核，分析关键承载路径状态。',
    reportWriting: '输出“现状-检测-结论-建议”格式的专项技术报告。',
    qualityMeasure: '检测人员分工复核，关键参数实行交叉审查。',
    safetyMeasure: '生产区分时段作业，设置警戒线并落实安全监护。',
    cooperation: '需委托方协调停机检测窗口并提供历史维修记录。'
  },
  {
    id: 4,
    entrustNo: 'WT-2026-004',
    schemeNo: 'JSFA-2026-004',
    schemeName: '桥梁构件检测技术方案',
    projectName: '城市快速路桥梁养护项目',
    appraisalType: '桥梁构件专项检测',
    writer: '孙工',
    reviewer: '郑工',
    approver: '周总工',
    createDate: '2026-02-18',
    date: '2026-02-18',
    updateTime: '2026-04-26 13:50:08',
    clientName: '华测工程咨询有限公司',
    projectAddress: '杭州市滨江区江南大道',
    overview: '项目涉及多跨桥梁养护，需识别关键构件病害并形成维修建议。',
    purposeScope: '覆盖主桥上部结构、关键墩台与支座系统，开展构件状态评估。',
    basis: '依据 CJJ/T 233 及桥梁检测相关技术规范。',
    quantity: '桥跨 6 联、墩台 18 个、支座 42 套、病害点 60 处。',
    equipment: '无人机巡检设备、裂缝仪、超声探伤仪、全站仪。',
    method: '采用外观普查与重点精检结合方式，对典型病害开展专项复核。',
    reportWriting: '报告提供病害等级、构件评价与养护优先级建议。',
    qualityMeasure: '统一检测口径和记录模板，过程数据全量存档。',
    safetyMeasure: '涉路检测执行交通导改方案，现场设置双重警戒。',
    cooperation: '需委托方协助办理占道审批并提供既有检测资料。'
  },
  {
    id: 5,
    entrustNo: 'WT-2026-005',
    schemeNo: 'JSFA-2026-005',
    schemeName: '既有建筑可靠性鉴定方案',
    projectName: '某办公楼功能升级工程',
    appraisalType: '建筑可靠性鉴定',
    writer: '吴工',
    reviewer: '冯工',
    approver: '张总工',
    createDate: '2026-01-22',
    date: '2026-01-22',
    updateTime: '2026-04-27 11:06:54',
    clientName: '华测工程咨询有限公司',
    projectAddress: '南京市鼓楼区中央路188号',
    overview: '项目为既有办公楼功能升级，需明确结构可靠性水平与持续使用条件。',
    purposeScope: '对主体结构及局部改造区域开展检测与综合评定，提出处置建议。',
    basis: '依据《民用建筑可靠性鉴定标准》GB 50292、《建筑结构可靠性设计统一标准》GB 50068 等。',
    quantity: '抽检楼层 8 层，构件 50 个，功能核查点 35 处。',
    equipment: '回弹仪、钢筋扫描仪、裂缝测宽仪、激光测距仪。',
    method: '资料核查与现场检测结合，必要时进行结构验算复核。',
    reportWriting: '按“现状调查-检测结果-分析评价-结论建议”编制报告。',
    qualityMeasure: '建立校核清单，关键参数交叉复核并留痕。',
    safetyMeasure: '控制临边和高处作业风险，落实用电与设备点检要求。',
    cooperation: '需提供竣工图及历史改造资料，并协调现场进出与封闭区域。'
  },
  {
    id: 6,
    entrustNo: 'WT-2026-006',
    schemeNo: 'JSFA-2026-006',
    schemeName: '商业综合体结构安全检测方案',
    projectName: '某商业综合体运营提升项目',
    appraisalType: '结构安全检测',
    writer: '周工',
    reviewer: '李工',
    approver: '陈总工',
    createDate: '2026-04-12',
    date: '2026-04-12',
    updateTime: '2026-05-04 09:05:10',
    clientName: '华测工程咨询有限公司',
    projectAddress: '深圳市南山区科苑路99号',
    overview: '综合体为大空间结构与多业态组合，运营改造前需开展安全检测与风险点排查。',
    purposeScope: '覆盖主要承重构件、转换层及人流密集区域，明确结构安全风险与改造约束。',
    basis: '依据 GB/T 50784 及相关检测鉴定标准规范。',
    quantity: '抽检梁柱 45 个，楼板测区 28 处，重点节点复核 15 处。',
    equipment: '回弹仪、钢筋扫描仪、超声检测仪、裂缝测宽仪。',
    method: '普查+重点抽检，结合图纸核对与构造检查形成综合结论。',
    reportWriting: '形成结构安全检测报告，附点位布置图与风险清单。',
    qualityMeasure: '关键数据双人复核，异常点复测确认。',
    safetyMeasure: '施工区与营业区分离，设置围挡与告示，明确现场监护。',
    cooperation: '需提供结构图纸与改造计划，并协调夜间检测时段。'
  },
  {
    id: 7,
    entrustNo: 'WT-2026-007',
    schemeNo: 'JSFA-2026-007',
    schemeName: '学校教学楼抗震鉴定方案',
    projectName: '某中学教学楼加固改造工程',
    appraisalType: '抗震鉴定',
    writer: '许工',
    reviewer: '何工',
    approver: '张总工',
    createDate: '2026-03-15',
    date: '2026-03-15',
    updateTime: '2026-04-30 16:30:22',
    clientName: '华测工程咨询有限公司',
    projectAddress: '成都市高新区学府路18号',
    overview: '教学楼为多层框架结构，拟实施抗震加固，需开展抗震鉴定与构造核查。',
    purposeScope: '评估抗震性能与薄弱环节，范围覆盖主体结构、楼梯间及关键节点构造。',
    basis: '依据《建筑抗震鉴定标准》GB 50023 等规范。',
    quantity: '抽检柱 20 根、梁 24 根、板 10 跨，节点构造核查 18 处。',
    equipment: '回弹仪、钢筋扫描仪、全站仪、裂缝测宽仪。',
    method: '现场检测结合构造检查与承载复核，形成抗震鉴定结论与建议。',
    reportWriting: '报告包含抗震性能评估、薄弱部位清单与加固建议。',
    qualityMeasure: '技术负责人审签，关键计算与结论复核。',
    safetyMeasure: '校园作业避开上课时段，设置安全隔离与引导标识。',
    cooperation: '需提供原始图纸与历次维修记录，并协调现场封闭与进出管理。'
  },
  {
    id: 8,
    entrustNo: 'WT-2026-008',
    schemeNo: 'JSFA-2026-008',
    schemeName: '医院门诊楼结构可靠性鉴定方案',
    projectName: '某医院门诊楼改扩建工程',
    appraisalType: '结构可靠性鉴定',
    writer: '沈工',
    reviewer: '钱工',
    approver: '周总工',
    createDate: '2026-02-08',
    date: '2026-02-08',
    updateTime: '2026-04-25 10:12:08',
    clientName: '华测工程咨询有限公司',
    projectAddress: '武汉市江汉区健康大道66号',
    overview: '门诊楼为公共建筑，使用频繁，改扩建前需评估结构可靠性与使用安全。',
    purposeScope: '覆盖主体结构与局部改造区域，评估可靠性等级并提出处置建议。',
    basis: '依据 GB 50292、GB 50068 及医院运行管理要求。',
    quantity: '抽检构件 52 个，关键节点核查 20 处，病害复核点 18 处。',
    equipment: '回弹仪、钢筋扫描仪、裂缝测宽仪、激光测距仪。',
    method: '资料核查+现场检测+结构复核，形成综合评定。',
    reportWriting: '报告输出可靠性评定结论、风险提示与处置建议。',
    qualityMeasure: '检测过程留痕，关键数据复测复核。',
    safetyMeasure: '保持医疗通道畅通，分区作业并加强噪声粉尘控制。',
    cooperation: '需协调检测时段并提供既有结构与改造资料。'
  },
  {
    id: 9,
    entrustNo: 'WT-2026-009',
    schemeNo: 'JSFA-2026-009',
    schemeName: '高层住宅外立面安全检测方案',
    projectName: '某高层住宅外立面隐患排查项目',
    appraisalType: '外立面安全检测',
    writer: '韩工',
    reviewer: '郑工',
    approver: '陈总工',
    createDate: '2026-04-20',
    date: '2026-04-20',
    updateTime: '2026-05-02 14:05:36',
    clientName: '华测工程咨询有限公司',
    projectAddress: '北京市朝阳区望京路108号',
    overview: '住宅外立面存在局部空鼓、开裂等隐患，需开展安全检测与风险分级。',
    purposeScope: '覆盖外墙饰面系统、附属构件与重点高风险区域，形成处置建议。',
    basis: '依据相关外墙检测标准与地方管理要求。',
    quantity: '抽检立面测区 60 处，重点节点核查 25 处，隐患点复核 30 处。',
    equipment: '空鼓检测仪、裂缝测宽仪、测距仪、影像记录设备。',
    method: '外观普查+抽检复核，结合风险分级形成整改清单。',
    reportWriting: '报告输出隐患分布、风险等级与整改建议。',
    qualityMeasure: '检测点位统一编号，记录与影像对应归档。',
    safetyMeasure: '高处作业严格执行安全防护与坠落防护要求。',
    cooperation: '需协调物业配合架设作业平台并提供立面维保记录。'
  },
  {
    id: 10,
    entrustNo: 'WT-2026-010',
    schemeNo: 'JSFA-2026-010',
    schemeName: '工业园区厂房承载力复核方案',
    projectName: '某工业园区产线增载改造项目',
    appraisalType: '承载力复核',
    writer: '陶工',
    reviewer: '李工',
    approver: '张总工',
    createDate: '2026-03-02',
    date: '2026-03-02',
    updateTime: '2026-04-29 09:46:55',
    clientName: '华测工程咨询有限公司',
    projectAddress: '宁波市北仑区港城大道20号',
    overview: '厂房拟新增重型设备与吊装工况，需复核结构承载能力与变形控制指标。',
    purposeScope: '覆盖设备基础区、关键梁柱体系与吊车梁系统，提出改造限制与加固建议。',
    basis: '依据工业建筑相关规范与结构复核要求。',
    quantity: '关键构件抽检 40 个，设备区测区 20 处，节点核查 18 处。',
    equipment: '全站仪、钢筋扫描仪、裂缝测宽仪、回弹仪。',
    method: '现场检测结合承载复核计算，必要时开展工况校核。',
    reportWriting: '报告输出承载复核结论、风险提示与加固建议。',
    qualityMeasure: '计算与检测数据一致性校验，复核结论二级审签。',
    safetyMeasure: '生产区分区作业，落实吊装与用电安全管理。',
    cooperation: '需提供设备布置与荷载参数，并协调停机检测窗口。'
  },
  {
    id: 11,
    entrustNo: 'WT-2026-011',
    schemeNo: 'JSFA-2026-011',
    schemeName: '地铁站附属结构检测方案',
    projectName: '某地铁站附属通道检测项目',
    appraisalType: '附属结构检测',
    writer: '邹工',
    reviewer: '何工',
    approver: '周总工',
    createDate: '2026-02-25',
    date: '2026-02-25',
    updateTime: '2026-04-24 17:02:11',
    clientName: '华测工程咨询有限公司',
    projectAddress: '广州市天河区轨道交通枢纽区',
    overview: '地铁站附属通道与出入口结构长期运营，需开展检测以评估现状与病害风险。',
    purposeScope: '覆盖通道衬砌、接缝部位与渗漏区域，形成维护建议。',
    basis: '依据轨道交通结构检测相关标准与运维要求。',
    quantity: '测区 45 处，渗漏点位复核 18 处，接缝检查 30 处。',
    equipment: '裂缝测宽仪、测距仪、影像记录设备、必要的无损检测设备。',
    method: '现场普查与重点抽检结合，形成病害分级与处置建议。',
    reportWriting: '报告输出病害分布、风险等级与维护建议。',
    qualityMeasure: '点位编号统一，记录完整可追溯。',
    safetyMeasure: '遵守运营区安全规范，确保通行不受影响。',
    cooperation: '需配合办理进场手续并提供既有运维资料。'
  },
  {
    id: 12,
    entrustNo: 'WT-2026-012',
    schemeNo: 'JSFA-2026-012',
    schemeName: '市政人行天桥检测鉴定方案',
    projectName: '某主干道人行天桥检测项目',
    appraisalType: '市政结构检测鉴定',
    writer: '罗工',
    reviewer: '郑工',
    approver: '陈总工',
    createDate: '2026-01-18',
    date: '2026-01-18',
    updateTime: '2026-04-23 10:20:09',
    clientName: '华测工程咨询有限公司',
    projectAddress: '长沙市岳麓区金星路',
    overview: '天桥长期服役，需对关键构件、连接节点与防腐状态进行检测并评估安全性。',
    purposeScope: '覆盖主梁、支座、连接节点与附属构件，提出维护与整改建议。',
    basis: '依据市政桥梁检测评定相关规范。',
    quantity: '构件抽检 30 处，连接节点核查 20 处，腐蚀点复核 25 处。',
    equipment: '超声探伤仪、测厚仪、全站仪、影像记录设备。',
    method: '外观普查+重点检测，结合构造核查形成综合结论。',
    reportWriting: '报告输出检测结果、风险点与维护建议。',
    qualityMeasure: '检测记录与影像资料对应归档，关键项复核。',
    safetyMeasure: '涉路作业设置警戒区并按交通导改方案执行。',
    cooperation: '需协助办理占道手续并提供既有检测资料。'
  },
  {
    id: 13,
    entrustNo: 'WT-2026-013',
    schemeNo: 'JSFA-2026-013',
    schemeName: '老旧小区建筑安全排查方案',
    projectName: '某老旧小区综合整治排查项目',
    appraisalType: '建筑安全排查',
    writer: '杜工',
    reviewer: '冯工',
    approver: '张总工',
    createDate: '2026-04-01',
    date: '2026-04-01',
    updateTime: '2026-05-01 08:40:33',
    clientName: '华测工程咨询有限公司',
    projectAddress: '天津市河西区友谊路片区',
    overview: '老旧小区建筑年代久，存在不同程度病害，需开展安全排查与风险分级。',
    purposeScope: '覆盖典型楼栋、重点病害部位与公共部位，形成排查台账与整改建议。',
    basis: '依据相关房屋安全鉴定标准与地方管理要求。',
    quantity: '排查楼栋 12 栋，重点复核点位 60 处，隐患点复核 40 处。',
    equipment: '裂缝测宽仪、测距仪、影像记录设备、必要的无损检测设备。',
    method: '普查为主、抽检为辅，结合风险分级形成整改清单。',
    reportWriting: '报告输出风险分级、隐患清单与整改建议。',
    qualityMeasure: '统一点位编号与记录模板，过程资料完整归档。',
    safetyMeasure: '高处与临边作业落实防护措施，确保居民通行安全。',
    cooperation: '需协调物业与居民配合入户检查并提供历史维修记录。'
  },
  // ... 前面 13 条数据保持不变
  {
    id: 14,
    entrustNo: 'WT-2026-014',
    schemeNo: 'JSFA-2026-014',
    schemeName: '深基坑周边房屋安全性鉴定方案',
    projectName: '某轨道交通站点周边房屋排查',
    appraisalType: '周边房屋鉴定',
    writer: '林工',
    reviewer: '钱工',
    approver: '张总工',
    createDate: '2026-04-15',
    date: '2026-04-15',
    updateTime: '2026-05-06 11:20:00',
    clientName: '华测工程咨询有限公司',
    projectAddress: '南京市建邺区江东中路',
    overview: '基坑开挖深达18米，需对周边50米范围内既有房屋进行施工前后安全性鉴定。',
    purposeScope: '评估基坑开挖对周边房屋的影响程度，建立监测预警机制。',
    basis: '依据《既有建筑鉴定与加固通用规范》及基坑工程监测技术规范。',
    quantity: '入户排查房屋 8 栋，沉降点 45 个。',
    equipment: '全站仪、高精度水准仪、裂缝测宽仪。',
    method: '现状入户调查+定期自动化监测。',
    reportWriting: '分阶段出具初始报告与最终鉴定报告。',
    qualityMeasure: '基准点定期复测，监测数据双重复核。',
    safetyMeasure: '入户佩戴工作证，注意交通与防高空坠物。',
    cooperation: '需建设方协调居委会配合入户。'
  },
  {
    id: 15,
    entrustNo: 'WT-2026-015',
    schemeNo: 'JSFA-2026-015',
    schemeName: '钢结构网架安全性检测方案',
    projectName: '某体育馆屋盖网架检测项目',
    appraisalType: '钢结构专项检测',
    writer: '高工',
    reviewer: '李工',
    approver: '周总工',
    createDate: '2026-03-10',
    date: '2026-03-10',
    updateTime: '2026-05-07 14:30:00',
    clientName: '华测工程咨询有限公司',
    projectAddress: '苏州市吴中区太湖体育中心',
    overview: '体育馆钢网架使用超10年，需对节点螺栓、杆件挠度专项检测。',
    purposeScope: '覆盖受力节点、支座及关键受压杆件。',
    basis: '依据《钢结构现场检测技术标准》。',
    quantity: '节点探伤 60 处，螺栓球检查 40 个。',
    equipment: '超声波探伤仪、全站仪、扭矩扳手。',
    method: '无损探伤与挠度线形复测结合。',
    reportWriting: '输出节点探伤专项报告与网架评定意见。',
    qualityMeasure: '探伤人员持证上岗，双设备比对。',
    safetyMeasure: '高空作业使用防坠器，划定下方警戒区。',
    cooperation: '需场馆方提供马道通行权限。'
  }
]

const createEmptyScheme = () => ({
  id: 0,
  schemeNo: '',
  schemeName: '',
  projectName: '',
  appraisalType: '',
  writer: '',
  reviewer: '',
  approver: '',
  createDate: '',
  date: '',
  updateTime: '',
  clientName: '',
  projectAddress: '',
  ...templateContent
})

const getTodayDate = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDateTime = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function useTechSchemeManager() {
  const filters = reactive({ keyword: '' })
  const schemeList = ref([...initialSchemes])
  const selectedIds = ref([])
  const regeneratingId = ref(null)
  const showEditor = ref(false)
  const isEditMode = ref(false)
  const editingId = ref(null)
  const previewScheme = ref(null)
  const formModel = ref(createEmptyScheme())
  const pagination = reactive({ page: 1, pageSize: 10 })

  const filteredRows = computed(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return schemeList.value.filter((item) => {
      if (!keyword) return true
      return [item.schemeName, item.projectName, item.schemeNo, item.entrustNo].join(' ').toLowerCase().includes(keyword)
    })
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pagination.pageSize)))

  const pageRows = computed(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return filteredRows.value.slice(start, start + pagination.pageSize)
  })

  const isAllSelected = computed(
    () => pageRows.value.length > 0 && pageRows.value.every((item) => selectedIds.value.includes(item.id))
  )

  const emptyText = computed(() => {
    if (schemeList.value.length === 0) return '暂无技术方案数据'
    return '暂无符合条件的技术方案'
  })

  const handleSearch = () => {
    pagination.page = 1
    selectedIds.value = []
  }

  const toggleSelected = (id, checked) => {
    if (checked) {
      if (!selectedIds.value.includes(id)) selectedIds.value.push(id)
      return
    }
    selectedIds.value = selectedIds.value.filter((item) => item !== id)
  }

  const toggleSelectAll = (checked) => {
    if (checked) {
      selectedIds.value = [...new Set([...selectedIds.value, ...pageRows.value.map((item) => item.id)])]
      return
    }
    selectedIds.value = selectedIds.value.filter((id) => !pageRows.value.some((item) => item.id === id))
  }

  const handleBatchDelete = () => {
    if (selectedIds.value.length === 0) {
      window.alert('请选择要删除的技术方案')
      return
    }
    const confirmed = window.confirm('确认删除选中的技术方案吗？')
    if (!confirmed) return
    schemeList.value = schemeList.value.filter((item) => !selectedIds.value.includes(item.id))
    selectedIds.value = []
    if (pagination.page > totalPages.value) pagination.page = totalPages.value
    window.alert('删除成功')
  }

  const openAddPanel = () => {
    isEditMode.value = false
    editingId.value = null
    formModel.value = {
      ...createEmptyScheme(),
      createDate: getTodayDate(),
      date: getTodayDate()
    }
    showEditor.value = true
  }

  const openEditPanel = (row) => {
    isEditMode.value = true
    editingId.value = row.id
    formModel.value = { ...row }
    showEditor.value = true
  }

  const closeEditor = () => {
    showEditor.value = false
    isEditMode.value = false
    editingId.value = null
    formModel.value = createEmptyScheme()
  }

  const openPreview = (row) => {
    previewScheme.value = row
  }

  const closePreview = () => {
    previewScheme.value = null
  }

  const saveScheme = () => {
    const now = formatDateTime(new Date())
    if (isEditMode.value && editingId.value !== null) {
      schemeList.value = schemeList.value.map((item) =>
        item.id === editingId.value ? { ...formModel.value, id: editingId.value, updateTime: now } : item
      )
    } else {
      const nextId = schemeList.value.length
        ? Math.max(...schemeList.value.map((item) => item.id)) + 1
        : 1
      schemeList.value.unshift({
        ...formModel.value,
        id: nextId,
        updateTime: now
      })
    }
    showEditor.value = false
    window.alert('保存成功')
  }

  const handleRegenerate = async (row) => {
    const confirmed = window.confirm('确认重新生成该技术方案吗？')
    if (!confirmed) return
    regeneratingId.value = row.id
    await new Promise((resolve) => window.setTimeout(resolve, 800))
    const now = formatDateTime(new Date())
    schemeList.value = schemeList.value.map((item) =>
      item.id === row.id ? { ...item, updateTime: now } : item
    )
    regeneratingId.value = null
    window.alert('技术方案已重新生成')
  }

  const prevPage = () => {
    if (pagination.page <= 1) return
    pagination.page -= 1
  }

  const nextPage = () => {
    if (pagination.page >= totalPages.value) return
    pagination.page += 1
  }

  const isAnyModalOpen = computed(() => showEditor.value || !!previewScheme.value)
  watch(isAnyModalOpen, (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  })
  onBeforeUnmount(() => {
    document.body.style.overflow = ''
  })

  return {
    filters,
    pageRows,
    filteredRows,
    pagination,
    totalPages,
    selectedIds,
    isAllSelected,
    emptyText,
    showEditor,
    isEditMode,
    formModel,
    previewScheme,
    regeneratingId,
    docSections,
    handleSearch,
    toggleSelected,
    toggleSelectAll,
    handleBatchDelete,
    openAddPanel,
    openEditPanel,
    closeEditor,
    openPreview,
    closePreview,
    saveScheme,
    handleRegenerate,
    prevPage,
    nextPage
  }
}

function selectOrderForScheme(order) {
  formModel.value.entrustNo = order.orderNo;
  formModel.value.projectName = order.projectName; // 同步带出工程名称
  formModel.value.clientName = order.clientName;   // 同步带出委托单位
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

const {
  filters,
  pageRows,
  filteredRows,
  pagination,
  totalPages,
  selectedIds,
  isAllSelected,
  emptyText,
  showEditor,
  isEditMode,
  formModel,
  previewScheme,
  regeneratingId,
  handleSearch,
  toggleSelected,
  toggleSelectAll,
  handleBatchDelete,
  openAddPanel,
  openEditPanel,
  closeEditor,
  openPreview,
  closePreview,
  saveScheme,
  handleRegenerate,
  prevPage,
  nextPage
} = useTechSchemeManager()
</script>

<style scoped>
/* ==========================================
   1. 页面整体布局 (严格对齐模块四)
   ========================================== */
.tech-scheme-page {
  padding: 20px !important;
  background-color: #f5f7fa !important;
  min-height: calc(100vh - 60px) !important;
  box-sizing: border-box !important;
  color: #1e293b !important;
}

/* 顶部操作栏 */
.action-bar {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  background-color: #ffffff !important;
  padding: 16px 24px !important;
  border-radius: 18px !important;
  /* 对齐大圆角 */
  margin-bottom: 20px !important;
  border: 1px solid #e3e9f3 !important;
  box-shadow: 0 10px 28px rgba(42, 63, 122, 0.07) !important;
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

/* 顶部按钮与输入框 */
.bar-actions {
  display: flex !important;
  gap: 12px !important;
  align-items: center !important;
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

/* ==========================================
   2. 表格容器 (严格对齐模块四)
   ========================================== */
.record-main-container {
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

.panel__title {
  display: none !important;
  /* 隐藏多余的内部大标题，模块四没有这个 */
}

.table-wrap {
  border: none !important;
  border-radius: 0 !important;
  background: transparent !important;
  overflow-x: auto !important;
}

/* ==========================================
   3. 表格内部 (严格对齐模块四)
   ========================================== */
table {
  width: 100% !important;
  border-collapse: collapse !important;
  text-align: center !important;
  font-size: 13px !important;
  /* 👈 改为 13px */
  color: #334155 !important;
  /* 👈 颜色加深，对齐第四模块 */
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}

/* 强力抹除全局 theme 的竖向边框和深蓝背景 */
th,
td {
  padding: 14px 12px !important;
  /* 👈 左右间距加大到 12px */
  border-bottom: 1px solid #edf2f7 !important;
  /* 👈 边框颜色更柔和 */
  border-right: none !important;
  height: auto !important;
}

th {
  background: #f3f6fb !important;
  color: #2A3F7A !important;
  font-weight: bold !important;
  /* 👈 改为标准加粗 */
  font-size: 13px !important;
  /* 👈 缩小至 13px */
  text-align: center !important;
  white-space: nowrap !important;
}

td {
  color: #334155 !important;
  /* 👈 颜色加深 */
  font-size: 13px !important;
  /* 👈 缩小至 13px */
  text-align: center !important;
}

tbody tr:hover {
  background-color: #f5f7fa !important;
}

.empty-cell {
  text-align: center !important;
  padding: 40px 0 !important;
  color: #909399 !important;
}

/* 复选框强对齐 */
.col-check {
  width: 40px !important;
}

.col-index {
  width: 60px !important;
}

.text-left {
  text-align: left !important;
}

/* ==========================================
   操作列字体微调 (严格对齐第四模块报价管理)
   ========================================== */
.row-actions {
  display: flex !important;
  justify-content: center !important;
  gap: 15px !important;
}

.text-btn {
  border: none !important;
  background: transparent !important;
  color: #2a3f7a !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  /* 👈 1. 取消加粗，恢复和报价管理一致的常规粗细 */
  font-family: inherit !important;
  /* 👈 2. 核心修复：强制 button 继承外部的漂亮字体 */
  cursor: pointer !important;
  padding: 0 !important;
  user-select: none !important;
  /* 👈 3. 防选中，对齐报价管理的 span 行为 */
}

.text-btn:hover {
  text-decoration: underline !important;
  opacity: 0.8 !important;
}

.icon-action {
  background: transparent !important;
  border: none !important;
  color: #2a3f7a !important;
  cursor: pointer !important;
  padding: 0 !important;
  font-size: 14px !important;
}

.icon-action:hover {
  opacity: 0.8 !important;
}

.icon-action:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================
   4. 翻页组件 (严格对齐模块四)
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
  background: #fff !important;
  outline: none !important;
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
}

/* ==========================================
   5. 弹窗与表单 (保持编辑能力)
   ========================================== */
.modal-overlay {
  position: fixed !important;
  inset: 0 !important;
  background: rgba(15, 23, 42, 0.45) !important;
  z-index: 3000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.edit-modal,
.preview-modal {
  background: #fff !important;
  border-radius: 18px !important;
  max-height: 90vh !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  width: 1040px !important;
  max-width: 95vw !important;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24) !important;
}

.modal-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 24px 26px !important;
  border-bottom: 1px solid #edf2f7 !important;
}

.modal-header h3 {
  margin: 0 !important;
  font-size: 20px !important;
  color: #2a3f7a !important;
  font-weight: 800 !important;
  border-left: 4px solid #2a3f7a !important;
  padding-left: 10px !important;
  line-height: 1.1 !important;
}

.modal-close {
  background: none !important;
  border: none !important;
  font-size: 26px !important;
  color: #909399 !important;
  cursor: pointer !important;
  padding: 0 4px !important;
}

.modal-close:hover {
  color: #f56c6c !important;
}

.modal-body {
  padding: 26px !important;
  overflow-y: auto !important;
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 24px !important;
  background: #f8fafc !important;
}

.modal-footer {
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
  padding: 18px 26px 24px !important;
  border-top: 1px solid #edf2f7 !important;
  background: #fff !important;
}

.form-card {
  background: #fff !important;
  border-radius: 12px !important;
  border: 1px solid #ebeef5 !important;
  padding: 20px !important;
}

.form-card h4 {
  font-size: 17px !important;
  font-weight: 800 !important;
  color: #2a3f7a !important;
  border-left: 3px solid #2a3f7a !important;
  padding-left: 10px !important;
  margin: 0 0 16px 0 !important;
  line-height: 1.1 !important;
}

.grid-two {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: 16px !important;
}

.grid-one {
  display: grid !important;
  grid-template-columns: 1fr !important;
  gap: 16px !important;
}

.field {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}

.field span {
  font-size: 13px !important;
  font-weight: 800 !important;
  color: #6b7a99 !important;
}

.field input,
.field textarea {
  padding: 8px 12px !important;
  font-size: 14px !important;
  border: 1px solid #dfe7f2 !important;
  border-radius: 10px !important;
  outline: none !important;
  font-family: inherit !important;
  width: 100% !important;
  box-sizing: border-box !important;
  background: #f8fafd !important;
  color: #1e293b !important;
}

.field input:focus,
.field textarea:focus {
  border-color: #2a3f7a !important;
  background: #fff !important;
}

.field textarea {
  min-height: 80px !important;
  resize: vertical !important;
}

/* 文档预览专属 */
.preview-body {
  background: #f8fafc !important;
}

.document-paper {
  max-width: 820px !important;
  margin: 0 auto !important;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 40px !important;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05) !important;
}

.cover-section {
  text-align: center !important;
  padding-bottom: 20px !important;
  margin-bottom: 20px !important;
  border-bottom: 1px dashed #d9e2ef !important;
}

.cover-section h1 {
  margin: 0 0 16px !important;
  font-size: 28px !important;
  color: #1e293b !important;
}

.doc-section {
  padding: 14px 0 !important;
  border-bottom: 1px solid #eef2f7 !important;
}

.doc-section h2 {
  margin: 0 0 10px !important;
  color: #2a3f7a !important;
  font-size: 16px !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease !important;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0 !important;
}

/* ==========================================
   自定义复选框样式
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
  border-radius: 4px !important;
  display: inline-block !important;
  transition: all 0.2s !important;
  position: relative !important;
  background-color: #fff !important;
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
   加粗方案编号
   ========================================== */
.bold-scheme {
  font-weight: 700 !important;
  /* 字体加粗 */
  color: #2a3f7a !important;
  /* 稍微加深颜色，使其更醒目（可选） */
}

/* 确保这个类名的颜色是 #2a3f7a */
.order-no-text {
  color: #2a3f7a !important;
  font-weight: 700 !important;
}

/* ==========================================
   终极强制覆盖：统一操作列按钮字体与粗细
   ========================================== */
.record-main-container table tbody tr td button.text-btn,
.record-main-container table tbody tr td span.action-link {
  /* 1. 强制使用和第四模块表格一模一样的优美字体引擎 */
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif !important;

  /* 2. 强制解除全局样式的加粗干扰，恢复正常粗细 */
  font-weight: 700 !important;

  /* 3. 统一字号与颜色 */
  font-size: 13px !important;
  color: #2a3f7a !important;

  /* 4. 抹平 button 和 span 的底层渲染差异 */
  background: transparent !important;
  border: none !important;
  padding: 0 4px !important;
  cursor: pointer !important;
  user-select: none !important;
  -webkit-font-smoothing: antialiased !important;
}

.record-main-container table tbody tr td button.text-btn:hover,
.record-main-container table tbody tr td span.action-link:hover {
  text-decoration: underline !important;
  opacity: 0.8 !important;
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

/* ==========================================
   委托单选择弹窗表格样式 (对齐电子原始记录的全包围边框)
   ========================================== */
.order-select-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.order-select-table th {
  background-color: #f3f6fb !important;
  padding: 12px 10px;
  text-align: center !important;
  border: 1px solid #edf2f7 !important;
  /* 全包围浅色边框 */
  font-size: 13px !important;
  color: #2a3f7a !important;
  font-weight: bold !important;
}

.order-select-table td {
  padding: 12px 10px;
  text-align: center !important;
  border: 1px solid #edf2f7 !important;
  /* 全包围浅色边框 */
  font-size: 13px !important;
  color: #334155 !important;
  word-break: break-all;
}

.order-select-table tbody tr:hover td {
  background-color: #f5f7fa !important;
}
</style>