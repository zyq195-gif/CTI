<template>
  <div v-if="showLanding" class="landing-page">
    <div class="landing-header">
      <div class="header-logo-box">
        <img src="../../assets/logo.svg" alt="CTI Logo" class="header-logo-img" />
        <div class="brand-divider"></div>
        <span class="module-text">AI 业务协同门户</span>
      </div>
      <div class="header-extra">智检未来 · 数字化赋能</div>
    </div>

    <div class="hero-section">
      <div class="hero-text-area">
        <div class="service-tag">数字化业务助手</div>
        <h1 class="hero-main-title">
          智能录入<br/>
          <span class="highlight">业务咨询助手</span>
        </h1>
        <p class="hero-desc">
          欢迎使用华测检测 AI 咨询平台。该助手旨在通过 AI 技术协助您快速梳理并录入检测业务的基础需求。
          信息记录完成后，我们将为您流转至专业工程师团队，提供深度解答。
        </p>
        <button class="hero-start-btn" @click="startChat">
          立即开启咨询 <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      <div class="hero-image-area">
        <img src="../../assets/building.png" alt="AI Visual" class="hero-visual" />
      </div>
    </div>
  </div>

  <template v-else>
    <!-- 👇 新增：重新包裹绝对布局容器，解决全局滚动条冲突的核心 👇 -->
    <div class="chat-layout-container">

      <!-- 顶部头部栏 -->
      <div class="view-content__head">
        <div class="bar-title">AI智能客服</div>
        <nav class="top-tabs">
          <button
            type="button"
            class="top-tab-item"
            :class="{ 'is-active': activeNav === 'chat' }"
            @click="activeNav = 'chat'"
          >
            当前对话
          </button>
          <button
            type="button"
            class="top-tab-item"
            :class="{ 'is-active': activeNav === 'history' }"
            @click="openHistory"
          >
            历史记录
          </button>
        </nav>
        <div class="view-content__toolbar">
          <template v-if="activeNav === 'chat'">
            <button type="button" class="ai-btn-new" @click="newConversation">
              <i class="fa-solid fa-plus"></i> 新建对话
            </button>
            <button
              type="button"
              class="ai-btn-save"
              :disabled="messages.length === 0"
              @click="saveConversation"
            >
              <i class="fa-solid fa-floppy-disk"></i> 保存对话
            </button>
          </template>
          <template v-if="activeNav === 'history'">
            <button
              type="button"
              class="btn btn-danger"
              :disabled="selectedHistoryIds.length === 0"
              @click="deleteSelectedHistory"
            >
              <i class="fa-solid fa-trash" style="margin-right: 4px;"></i> 删除
            </button>
          </template>
        </div>
      </div>

      <!-- 当前聊天面板 -->
      <section v-show="activeNav === 'chat'" class="ai-full__panel ai-full__panel--chat">

        <!-- 聊天消息列表区（内部滚动） -->
        <div ref="scrollRef" class="ai-full__messages">
          <transition-group name="message-list">
            <div
              v-for="(m, index) in messages"
              :key="m.id"
              class="ai-full__row"
              :class="m.role === 'user' ? 'ai-full__row--user' : 'ai-full__row--assistant'"
            >
              <div class="chat-avatar">
                <div v-if="m.role === 'assistant'" class="avatar-circle ai-avatar">
                  <img src="../../assets/image.png" alt="AI Avatar" class="ai-avatar-img" />
                </div>
                <div v-else class="avatar-circle user-avatar">
                  <i class="fa-solid fa-user"></i>
                </div>
              </div>

              <div class="chat-content">
                <div class="chat-bubble-wrapper">
                  <div class="chat-body-flex">
                    <div class="ai-full__bubble" :class="m.role === 'user' ? 'ai-full__bubble--user' : 'ai-full__bubble--ai'">
                      <p class="ai-full__text">{{ m.content }}</p>
                      <div v-if="m.options && m.options.length" class="chat-options-container">
                        <button
                          v-for="(opt, idx) in m.options"
                          :key="idx"
                          class="chat-option-btn"
                          :disabled="sending"
                          @click="handleOptionClick(opt)"
                        >
                          {{ opt }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="chat-bubble-footer" :class="{ 'is-user': m.role === 'user' }">
                    <div class="chat-actions" v-if="m.role === 'assistant'">
                      <button
                        v-if="index > 0"
                        type="button"
                        class="btn-action-icon"
                        title="复制内容"
                        @click="copyMessage(m.content)"
                      >
                        <i class="fa-regular fa-copy"></i>
                      </button>
                      <button
                        v-if="index === messages.length - 1 && index > 0"
                        type="button"
                        class="btn-action-icon"
                        title="重新生成此回复"
                        :disabled="sending"
                        @click="regenerate(index)"
                      >
                        <i class="fa-solid fa-rotate-right" :class="{ 'is-spinning': sending }"></i>
                      </button>
                    </div>
                    <span class="chat-time">{{ formatChatTime(m.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- 底部输入区 -->
        <footer class="ai-full__input-area">
          <div class="input-container">
            <textarea
              v-model="draft"
              class="ai-full__textarea"
              rows="2"
              placeholder="在此输入您的问题或需求（Enter 发送）..."
              :disabled="sending"
              @keydown="onKeydown"
            ></textarea>
            <button
              type="button"
              class="ai-full__btn-send"
              :disabled="!draft.trim() || sending"
              @click="send"
            >
              {{ sending ? '...' : '发送' }}
            </button>
          </div>
          <div class="ai-disclaimer">提示：内容由AI生成，请注意甄别！</div>
        </footer>
      </section>

      <!-- 历史记录区域 -->
      <div v-show="activeNav === 'history'" class="history-section">
        <table class="report-table">
          <thead>
            <tr>
              <th width="40">
                <label class="cb-wrap">
                  <input type="checkbox" :checked="isAllSelectedOnPage" @change="toggleSelectAllOnPage">
                  <span class="cb-icon"></span>
                </label>
              </th>
              <th width="80">序号</th>
              <th width="350">对话名称</th>
              <th width="240">账号</th>
              <th width="240">消息条数</th>
              <th width="240">保存时间</th>
              <th width="180">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in paginatedSavedList" :key="item.id">
              <td class="check-col">
                <label class="cb-wrap">
                  <input type="checkbox" :value="item.id" v-model="selectedHistoryIds">
                  <span class="cb-icon"></span>
                </label>
              </td>
              <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.account || '华测工程师' }}</td>
              <td>{{ item.messages ? item.messages.length : 0 }} 条</td>
              <td>{{ formatSavedAt(item.savedAt) }}</td>
              <td class="table-actions">
                <span class="action-link" @click="viewHistory(item)">查看</span>
                <span class="action-link" @click="exportHistory(item)">导出</span>
              </td>
            </tr>
            <tr v-if="savedList.length === 0">
              <td colspan="6" class="empty-text">暂无历史记录</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" v-if="savedList.length > 0">
          <span class="total-text">共 {{ savedList.length }} 条</span>
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

      <!-- 弹窗 -->
      <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">{{ viewingItem?.title }} <span style="font-size: 13px; color: #94a3b8; font-weight: normal; margin-left: 10px;">(所属账号：{{ viewingItem?.account }})</span></h3>
            <button class="btn-close" @click="showModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body ai-full__messages">
            <div
              v-for="(m, index) in viewingItem?.messages"
              :key="index"
              class="ai-full__row"
              :class="m.role === 'user' ? 'ai-full__row--user' : 'ai-full__row--assistant'"
            >
              <div class="chat-avatar">
                <div v-if="m.role === 'assistant'" class="avatar-circle ai-avatar">
                  <img src="../../assets/image.png" alt="AI Avatar" class="ai-avatar-img" />
                </div>
                <div v-else class="avatar-circle user-avatar">
                  <i class="fa-solid fa-user"></i>
                </div>
              </div>

              <div class="chat-content">
                <div class="chat-bubble-wrapper">
                  <div class="chat-body-flex">
                    <div class="ai-full__bubble" :class="m.role === 'user' ? 'ai-full__bubble--user' : 'ai-full__bubble--ai'">
                      <p class="ai-full__text">{{ m.content }}</p>
                      <div v-if="m.options && m.options.length" class="chat-options-container">
                        <button v-for="(opt, idx) in m.options" :key="idx" class="chat-option-btn" disabled>
                          {{ opt }}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="chat-bubble-footer" :class="{ 'is-user': m.role === 'user' }">
                    <span class="chat-time">{{ formatChatTime(m.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </template>
</template>

<script setup>
import { nextTick, onMounted, ref, watch, computed } from 'vue'
import { saveAs } from 'file-saver';
import {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, WidthType,
  VerticalAlign, AlignmentType
} from 'docx';

defineOptions({ name: 'AIChatService' })

const showLanding = ref(true);

const selectedHistoryIds = ref([])
const isAllSelectedOnPage = computed(() => {
  if (paginatedSavedList.value.length === 0) return false
  return paginatedSavedList.value.every(item => selectedHistoryIds.value.includes(item.id))
})

function toggleSelectAllOnPage(e) {
  const checked = e.target.checked
  if (checked) {
    selectedHistoryIds.value = paginatedSavedList.value.map(item => item.id)
  } else {
    selectedHistoryIds.value =[]
  }
}

const startChat = () => { showLanding.value = false; };

const STORAGE_KEY = 'ai-customer-service-saved-v2'
const activeNav = ref('chat')
const conversationTitle = ref('')
const draft = ref('')
const sending = ref(false)
const scrollRef = ref(null)
const savedList = ref([])

const showModal = ref(false)
const viewingItem = ref(null)

const currentPage = ref(1)
const pageSize = ref(10)

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: '您好，欢迎咨询华测检测AI业务平台。我是智能客服助手，负责为您记录基础委托信息。\n请简要描述您的检测需求或留下联系方式，稍后将由专业人工顾问与您取得联系。',
  options:['📝 提交企业检测需求', '📞 留下联系方式等待回拨', '❓ 咨询常见检测周期'],
  createdAt: Date.now(),
}

const messages = ref([{ ...WELCOME, createdAt: Date.now() }])

let idSeq = 0
function nextId() { return `m-${Date.now()}-${++idSeq}` }

function scrollToBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function formatChatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function mockAssistantReply(userText) {
  const t = userText.trim();
  if (t === '📝 提交企业检测需求') {
    return '好的，请问您的企业名称是什么？主要需要进行哪类检测鉴定（如：厂房结构鉴定、材料防腐检测等）？信息记录后我会立刻流转给业务专员。';
  }
  if (t === '📞 留下联系方式等待回拨') {
    return '没问题，请在此留下您的【称呼】和【联系电话】，我们的专业工程师会在工作日 2 小时内为您人工回电。';
  }
  if (t === '❓ 咨询常见检测周期') {
    return '常规的结构鉴定或材料检测一般周期为 5-10 个工作日，具体视工程量和现场情况而定。\n您可以先留下工程概况和联系方式，我们将由人工为您评估准确的排期与报价。';
  }
  return `您的信息：“${t.slice(0, 30)}...”已成功记录在案。\n为了让工程师更准确地为您服务，请问是否还需要补充具体的【工程地址】或【对接人电话】？完成后我们将尽快安排人工回访。`;
}

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  messages.value.push({ id: nextId(), role: 'user', content: text, createdAt: Date.now() })
  draft.value = ''
  sending.value = true
  try {
    await new Promise((r) => setTimeout(r, 800))
    messages.value.push({ id: nextId(), role: 'assistant', content: mockAssistantReply(text), createdAt: Date.now() })
  } finally {
    sending.value = false
  }
}

function handleOptionClick(opt) {
  if (sending.value) return
  draft.value = opt
  send()
}

async function copyMessage(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

async function regenerate(index) {
  if (sending.value) return
  const aiMsg = messages.value[index]
  let userText = ''
  if (index > 0 && messages.value[index - 1].role === 'user') {
    userText = messages.value[index - 1].content
  }

  aiMsg.content = '正在重新生成中...'
  sending.value = true

  try {
    await new Promise((r) => setTimeout(r, 800))
    const t = userText.trim()
    const variants = [
      `[已重新生成] 关于“${t.slice(0, 30)}...”，除了上述的应用场景和时间节点，请问您对系统架构或预算是否有初步的想法？`,
      `[已更新] 收到您的反馈：“${t.slice(0, 30)}...”。您可以继续提供更多的业务痛点，我会据此为您定制更详尽的技术方案。`
    ]
    aiMsg.content = variants[Math.floor(Math.random() * variants.length)]
    aiMsg.createdAt = Date.now()
  } finally {
    sending.value = false
  }
}

function onKeydown(e) {
  if (e.key !== 'Enter' || e.shiftKey) return
  e.preventDefault()
  send()
}

function readSavedFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    } else {
      const defaultList =[]
      for(let i = 1; i <= 15; i++) {
        defaultList.push({
          id: `mock-id-${i}`,
          title: `历史业务咨询记录 - ${String(i).padStart(2, '0')}`,
          account: i % 2 === 0 ? 'admin_test' : '华测工程师',
          savedAt: Date.now() - i * 3600000 * 12,
          messages:[
            { role: 'assistant', content: '您好，我是您的智能业务助理。请告诉我您的咨询产品、遇到的问题或期望目标，我会协助您整理出清晰的技术需求。', createdAt: Date.now() - i * 3600000 * 12 - 120000 },
            { role: 'user', content: `你好，我想了解一下第 ${i} 生产线的设备监测系统解决方案。目前需要采集温度和振动数据。`, createdAt: Date.now() - i * 3600000 * 12 - 60000 },
            { role: 'assistant', content: `已收到您的信息。关于第 ${i} 生产线的设备监测，采集温度和振动数据是非常基础且重要的环节。为了更准确地协助您，建议补充：\n1. 具体的工作环境（如是否高温高湿、是否有防爆要求）\n2. 期望完成部署的时间节点。`, createdAt: Date.now() - i * 3600000 * 12 - 30000 },
            { role: 'user', content: `环境比较恶劣，是高温粉尘车间。预计下个季度初需要上线。`, createdAt: Date.now() - i * 3600000 * 12 - 15000 },
            { role: 'assistant', content: `已为您记录核心需求：\n- **监测数据**：温度、振动\n- **工作环境**：高温、粉尘（设备需具备高级别防尘耐高温属性）\n- **时间节点**：下个季度初上线\n\n稍后将有专门的技术顾问为您生成详细的传感器选型与网络拓扑方案。`, createdAt: Date.now() - i * 3600000 * 12 }
          ]
        })
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultList))
      return defaultList
    }
  } catch { return[] }
}

function refreshSavedList() { savedList.value = readSavedFromStorage() }

function openHistory() {
  activeNav.value = 'history';
  refreshSavedList();
  currentPage.value = 1;
  selectedHistoryIds.value =[];
}

function formatSavedAt(ts) { try { return new Date(ts).toLocaleString() } catch { return String(ts) } }

const paginatedSavedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return savedList.value.slice(start, start + pageSize.value)
})

const totalPages = computed(() => {
  return Math.ceil(savedList.value.length / pageSize.value) || 1
})

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const handleSizeChange = () => { currentPage.value = 1 }

function exportToWord(title, msgs) {
  const doc = new Document({
    sections:[{
      properties: {},
      children:[
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children:[
            new TextRun({ text: "华测检测 - AI 智能助手对话记录", bold: true, size: 32, color: "2a3f7a" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children:[
            new TextRun({ text: `对话名称：${title}`, bold: true, size: 24 }),
            new TextRun({ text: `\t导出时间：${new Date().toLocaleString()}`, size: 20 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows:[
            new TableRow({
              tableHeader: true,
              children:[
                createTableCell("发送者", true, "f1f5f9", 20),
                createTableCell("对话内容", true, "f1f5f9", 60),
                createTableCell("时间", true, "f1f5f9", 20),
              ],
            }),
            ...msgs.map(m => new TableRow({
              children:[
                createTableCell(m.role === 'user' ? "我" : "智能客服", false),
                createTableCell(m.content, false),
                createTableCell(formatChatTime(m.createdAt), false),
              ]
            }))
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children:[
            new TextRun({ text: "提示：以上内容由 AI 自动生成，仅供业务参考。", size: 18, color: "94a3b8" }),
          ],
        }),
      ],
    }],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${title}.docx`);
    window.alert(`「${title}」已成功导出为 Word 文档。`);
  });
}

function createTableCell(text, isHeader = false, bgColor = "ffffff", width = null) {
  return new TableCell({
    shading: { fill: bgColor },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    children:[
      new Paragraph({
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        children:[
          new TextRun({ text: text, bold: isHeader, size: 22, color: isHeader ? "2a3f7a" : "333333" }),
        ],
      }),
    ],
  });
}

async function saveConversation() {
  if (messages.value.length === 0) return;

  const defaultTitle = conversationTitle.value || `对话_${new Date().toLocaleDateString()}`;
  const inputTitle = window.prompt('请为本次保存的对话命名：', defaultTitle);
  if (inputTitle === null) return;

  const title = inputTitle.trim() || defaultTitle;
  conversationTitle.value = title;

  const payload = {
    id: nextId(), title, account: '华测工程师', savedAt: Date.now(),
    messages: messages.value.map(({ id, role, content, createdAt, options }) => ({
      id, role, content, createdAt, options
    })),
  };
  try {
    const list = readSavedFromStorage();
    list.unshift(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    refreshSavedList();
  } catch (e) {
    console.error('Local storage save failed', e);
  }

  exportToWord(title, messages.value);
}

function exportHistory(item) { exportToWord(item.title, item.messages); }

function viewHistory(item) {
  viewingItem.value = item;
  showModal.value = true;
}

function deleteSelectedHistory() {
  if (selectedHistoryIds.value.length === 0) {
    alert('请先选择要删除的记录')
    return
  }
  if (!confirm(`确定删除已选择的 ${selectedHistoryIds.value.length} 条记录吗？`)) return

  const newList = savedList.value.filter(item => !selectedHistoryIds.value.includes(item.id))
  savedList.value = newList
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newList))

  selectedHistoryIds.value =[]

  const maxPage = Math.ceil(savedList.value.length / pageSize.value) || 1
  if (currentPage.value > maxPage) currentPage.value = maxPage
}

function newConversation() {
  if (messages.value.length > 1 && !window.confirm('确定要清空当前页面开启新对话吗？')) return
  conversationTitle.value = ''
  draft.value = ''
  messages.value =[{ ...WELCOME, id: 'welcome', createdAt: Date.now() }]
  activeNav.value = 'chat'
  scrollToBottom()
}

watch(() => messages.value.length, () => scrollToBottom(), { flush: 'post' })
watch(activeNav, (v) => { if (v === 'chat') scrollToBottom() })
onMounted(() => { scrollToBottom(); refreshSavedList() })
</script>

<style scoped>

/* ==================================
   2. 欢迎引导页面 (Landing Page)
   ================================== */
.landing-page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 10%; overflow: hidden; position: relative; }
.landing-header { position: absolute; top: 40px; left: 6%; right: 6%; display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid rgba(42, 63, 122, 0.08); animation: fadeInDown 0.8s ease-out; }
.header-logo-box { display: flex; align-items: center; gap: 12px; }
.header-logo-img { height: 28px; width: auto; display: block; margin-top: -8px; }
.brand-divider { width: 1px; height: 18px; background-color: #e2e8f0; margin: 0 4px; }
.module-text { font-size: 16px; font-weight: 600; color: #1e293b; line-height: 1; margin: 0; display: flex; align-items: center; }

.hero-section { display: flex; align-items: center; gap: 80px; max-width: 1240px; width: 100%; }
.hero-text-area { flex: 1; text-align: left; animation: fadeInLeft 0.6s ease-out forwards; animation-delay: 0.1s; opacity: 0; margin-left: -30px; }
.service-tag { color: #2a3f7a; font-size: 14px; font-weight: 600; margin-bottom: 24px; padding: 8px 16px; background: #f1f5f9; display: inline-block; border-radius: 4px; letter-spacing: 1px; animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
.hero-main-title { font-size: 64px; color: #1e293b; font-weight: 800; margin-bottom: 24px; line-height: 1; animation: fadeInUp 0.5s ease-out forwards; animation-delay: 0.1s; opacity: 0; }
.hero-main-title .highlight { color: #2a3f7a; background: linear-gradient(120deg, rgba(42, 63, 122, 0.08) 0%, transparent 100%); padding-right: 20px; display: inline-block; margin-top: 0.5em; }
.hero-desc { font-size: 18px; line-height: 1.8; color: #475569; margin-bottom: 56px; max-width: 580px; animation: fadeInUp 0.5s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
.hero-start-btn { background: #2a3f7a; color: #ffffff; border: none; padding: 20px 60px; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 25px rgba(42, 63, 122, 0.15); animation: fadeInUp 0.5s ease-out forwards; animation-delay: 0.3s; opacity: 0; margin-top: 30px; }
.hero-start-btn:hover { background: #3e5a9e; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(42, 63, 122, 0.25); }

.hero-image-area { flex: 1.2; display: flex; justify-content: center; animation: fadeInRight 0.6s ease-out forwards; animation-delay: 0.2s; opacity: 0; }
.hero-visual { width: 100%; max-width: 600px; height: auto; border-radius: 0; box-shadow: none !important; background-color: transparent !important; display: block; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.05)); animation: scaleIn 0.7s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards; animation-delay: 0.3s; opacity: 0; }

@media (max-width: 1100px) {
  .hero-section { display: flex; align-items: center; gap: 80px; max-width: 1240px; width: 100%; margin-top: 100px; }
  .hero-text-area { text-align: center; }
  .hero-desc { margin-left: auto; margin-right: auto; }
}

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

/* ==================================
   3. ★ 核心布局护城河（绝对定位锁定） ★
   ================================== */
.chat-layout-container {
  display: flex;
  flex-direction: column;
  /* 动态计算高度：屏幕总高度 减去 顶栏和外边距 (约 120px，如果底部还有被遮挡可以改为 140px) */
  height: calc(100vh - 120px);
  min-height: 0;           /* 必须有：防止被子元素撑开高度 */
  width: 100%;             /* 限制在右侧容器内 */
  overflow: hidden;        /* 拦截全局溢出，消灭外部滚动条 */
  background: #ffffff;
  border-radius: 12px;
  box-shadow: none; /* 加个轻微投影，与系统底色区分 */
}
.view-content__head { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid #f0f2f5; background: #fff; gap: 40px; flex-shrink: 0; }
.bar-title { font-family: "Microsoft YaHei", "微软雅黑", sans-serif !important; font-size: 20px; font-weight: bold; color: #2a3f7a; border-left: 4px solid #2a3f7a; padding-left: 12px; line-height: 1.2; margin: 0; display: inline-block; }

.top-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
.top-tab-item { padding: 6px 20px; border: none; background: transparent; color: #64748b; font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 6px; transition: all 0.3s ease; }
.top-tab-item.is-active { background: #fff; color: #2a3f7a; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

.view-content__toolbar { margin-left: auto; display: flex; gap: 12px; align-items: center; }
.ai-btn-save, .ai-btn-new { border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; transition: all 0.3s; font-weight: 500; }
.ai-btn-save i, .ai-btn-new i { margin-right: 8px; top: 4px; }
.ai-btn-save { background: #2a3f7a; color: #fff; }
.ai-btn-save:hover:not(:disabled) { opacity: 0.9; }
.ai-btn-save:disabled { background: #cbd5e1; cursor: not-allowed; }
.ai-btn-new { background: #f1f5f9; color: #2a3f7a; border: 1px solid #cbd5e1; }
.ai-btn-new:hover { background: #e2e8f0; }

.view-content__toolbar .btn { display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important; height: 32px !important; padding: 0 15px !important; box-sizing: border-box !important; font-size: 14px !important; font-weight: 500 !important; border-radius: 4px !important; cursor: pointer !important; transition: all 0.2s !important; border: 1px solid transparent !important; font-family: inherit !important; }
.view-content__toolbar .btn-danger { background: #f56c6c !important; color: #fff !important; border-color: #f56c6c !important; }
.view-content__toolbar .btn-danger:hover:not(:disabled) { background: #f89898 !important; border-color: #f89898 !important; }
.view-content__toolbar .btn-danger:active:not(:disabled) { background: #dd6161 !important; border-color: #dd6161 !important; }
.view-content__toolbar .btn-danger:disabled { opacity: 1 !important; background: #f56c6c !important; border-color: #f56c6c !important; color: #fff !important; cursor: not-allowed !important; transform: none !important; box-shadow: none !important; }

/* 中间面板弹性填充（包含聊天/历史） */
.ai-full__panel, .history-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0 !important; /* 核心魔法：坚决禁止被子元素撑开高度 */
  overflow: hidden;
}

/* ==================================
   4. ★ 当前对话专属 (内部滚动) ★
   ================================== */
.ai-full__messages {
  flex: 1;
  min-height: 0 !important;     /* 必须要有 */
  overflow-y: auto;             /* 内容溢出时产生内部滚动条 */
  overflow-x: hidden;

  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f4f7fb 0%, #eef3fb 100%);
  display: flex;
  flex-direction: column;
  gap: 24px;

  /* 清透圆角边框 */
  border-radius: 16px !important;
  margin: 16px 16px 0 16px !important; /* 不贴边，给滚动条留出余地 */
  border: 1px solid #e3e9f3 !important;
  box-shadow: 0 4px 20px rgba(42, 63, 122, 0.04) !important;
}

.ai-full__messages::-webkit-scrollbar { width: 6px; }
.ai-full__messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.ai-full__messages::-webkit-scrollbar-track { background: transparent; margin: 10px 0; }

.ai-full__row { display: flex; width: 100%; gap: 14px; align-items: flex-start; }
.ai-full__row--user { flex-direction: row-reverse; }
.chat-avatar { flex-shrink: 0; margin-top: 0px; }
.avatar-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.ai-avatar { background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.ai-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.user-avatar { background: #2a3f7a; color: #fff; font-size: 18px; }

.chat-content { display: flex; flex-direction: column; max-width: 65%; }
.ai-full__row--user .chat-content { align-items: flex-end; }
.ai-full__row--assistant .chat-content { align-items: flex-start; }
.chat-body-flex { display: flex; align-items: center; gap: 10px; }
.ai-full__row--user .chat-body-flex { flex-direction: row-reverse; }

.chat-bubble-wrapper { display: flex; flex-direction: column; align-items: flex-end; }
.ai-full__bubble { padding: 14px 18px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.ai-full__bubble--ai { background: rgba(255, 255, 255, 0.75); color: #1e293b; border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(255, 255, 255, 0.5); border-radius: 4px 16px 16px 16px; }
.ai-full__bubble--user { background: linear-gradient(135deg, #4364c7 0%, #2a3f7a 100%); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 12px rgba(42, 63, 122, 0.25); border-radius: 16px 4px 16px 16px; }
.ai-full__text { margin: 0; line-height: 1.6; font-size: 14px; white-space: pre-wrap; }

.chat-options-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(42, 63, 122, 0.06); }
.chat-option-btn { background: rgba(255, 255, 255, 0.6); color: #3b5cb8; border: 1px solid rgba(59, 92, 184, 0.2); padding: 8px 16px; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; backdrop-filter: blur(4px); }
.chat-option-btn:hover:not(:disabled) { background: rgba(59, 92, 184, 0.08); color: #2a3f7a; border-color: #3b5cb8; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(59, 92, 184, 0.15); }
.chat-option-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.chat-bubble-footer { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 8px; }
.chat-bubble-footer.is-user { justify-content: flex-end; }
.chat-actions { display: flex; gap: 6px; }
.btn-action-icon { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 4px 6px; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.btn-action-icon:hover:not(:disabled) { color: #2a3f7a; background: #e2e8f0; }
.btn-action-icon:disabled { opacity: 0.5; cursor: not-allowed; }
.chat-time { font-size: 11px; line-height: 1; color: #94a3b8; }

.is-spinning { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ==================================
   5. 底部输入区 (固定高度)
   ================================== */
.ai-full__input-area {
  flex-shrink: 0;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.input-container { width: 100%; display: flex; align-items: flex-end; background: rgba(255, 255, 255, 0.85); border-radius: 16px; padding: 12px 20px; gap: 12px; border: 1px solid rgba(42, 63, 122, 0.15); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02); }
.input-container:focus-within { background: #fff; border-color: #4364c7; box-shadow: 0 0 0 3px rgba(67, 100, 199, 0.15), 0 4px 15px rgba(0, 0, 0, 0.05); transform: translateY(-1px); }
.ai-full__textarea { flex: 1; border: none; background: transparent; resize: none; font-size: 14px; padding: 4px 0; min-height: 80px; max-height: 150px; outline: none; color: #1e293b; line-height: 1.5; }

.ai-full__btn-send { background: linear-gradient(135deg, #4364c7 0%, #2a3f7a 100%); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.3s; font-size: 14px; margin-bottom: 2px; box-shadow: 0 4px 12px rgba(42, 63, 122, 0.2); }
.ai-full__btn-send:hover:not(:disabled) { box-shadow: 0 6px 16px rgba(42, 63, 122, 0.3); transform: translateY(-1px); }
.ai-disclaimer { margin-top: 12px; font-size: 12px; color: #94a3b8; letter-spacing: 0.5px; }

/* ==================================
   6. 历史记录与表格
   ================================== */
.history-section { padding: 24px; background-color: #fffff; box-sizing: border-box; display: block; overflow-y: auto; }
.history-section::-webkit-scrollbar { width: 6px; }
.history-section::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

.report-table { width: 100%; border-collapse: collapse; text-align: center; font-size: 14px; color: #606266; }
.report-table th, .report-table td { padding: 14px 10px; border-bottom: 1px solid #ebeef5; vertical-align: middle; }
.report-table th { color: #909399; font-weight: 500; }
.report-table tbody tr:hover { background-color: #f5f7fa; }
.empty-text { text-align: center; padding: 40px 0 !important; color: #909399; }
.table-actions { display: flex; justify-content: center; gap: 15px; }
.action-link { color: #2a3f7a; cursor: pointer; font-size: 14px; user-select: none; }
.action-link:hover { opacity: 0.8; text-decoration: underline; }

.cb-wrap { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; color: #606266; user-select: none; }
.cb-wrap input { display: none; }
.cb-icon { width: 16px; height: 16px; border: 2px solid #dcdfe6; border-radius: 3px; display: inline-block; transition: all 0.2s; position: relative; }
.cb-wrap input:checked + .cb-icon { background: #2a3f7a; border-color: #2a3f7a; }
.cb-wrap input:checked + .cb-icon::after { content: ''; position: absolute; left: 4px; top: 1px; width: 4px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: rotate(45deg); }
.check-col { width: 40px; text-align: center; }

.pagination { display: flex; justify-content: flex-end; align-items: center; margin-top: 20px; font-size: 13px; color: #606266; }
.total-text { margin-right: 15px; }
.page-select { padding: 2px 5px; border: 1px solid #dcdfe6; border-radius: 4px; margin-right: 15px; color: #606266; }
.pager-btns { display: flex; align-items: center; gap: 5px; }
.pager-arrow, .pager-num { display: inline-flex; justify-content: center; align-items: center; width: 28px; height: 28px; background-color: #f4f4f5; border-radius: 4px; cursor: pointer; }
.pager-arrow.disabled { color: #c0c4cc; cursor: not-allowed; }
.pager-num.active { background-color: #2a3f7a; color: #fff; }

/* ==================================
   7. 弹窗样式
   ================================== */
.modal-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-content { width: 860px; max-width: 90%; height: 85%; background: #fff; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.15); animation: modal-pop 0.3s ease-out; overflow: hidden; }
@keyframes modal-pop { 0% { opacity: 0; transform: translateY(20px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
.modal-header { padding: 16px 24px; border-bottom: 1px solid #f0f2f5; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.modal-title { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
.btn-close { background: transparent; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; padding: 4px; transition: color 0.2s; }
.btn-close:hover { color: #f56c6c; }
.modal-body { flex: 1; overflow-y: auto; padding: 24px; background: #f8fafc; }
.message-list-enter-active { transition: all 0.4s ease-out; }
.message-list-enter-from { opacity: 0; transform: translateY(20px); }

/* ==================================
   ★ 快捷选项卡片（药丸按钮）优化 ★
   ================================== */
.chat-options-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px; /* 拉开一点间距，呼吸感更好 */
  margin-top: 16px;
  padding-top: 16px;
  /* 换用更柔和的虚线分割线，显得更精致 */
  border-top: 1px dashed rgba(42, 63, 122, 0.15);
}

.chat-option-btn {
  /* 👈 将底色改为带 8% 透明度的华测蓝 (42, 63, 122是#2a3f7a的RGB) */
  background: rgba(42, 63, 122, 0.08);
  backdrop-filter: blur(4px);            /* 👈 配合透明度增加一点毛玻璃模糊效果 */
  -webkit-backdrop-filter: blur(4px);

  color: #2a3f7a;
  /* 👈 配合透明底色，加一层极微弱的半透明边框勾勒光泽边缘 */
  border: 1px solid rgba(42, 63, 122, 0.06);

  padding: 10px 18px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(42, 63, 122, 0.03); /* 稍微降低默认阴影，让它看起来更轻盈 */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 鼠标悬浮时的效果：变亮蓝、上浮、阴影加深 */
.chat-option-btn:hover:not(:disabled) {
  background: #eef2ff; /* 华测蓝的极浅色，非常清爽 */
  color: #1e3a8a;
  border-color: #c7d2fe;
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(42, 63, 122, 0.1);
}

/* 鼠标点击按下的瞬间：产生物理按压回弹感 */
.chat-option-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(42, 63, 122, 0.04);
}

/* 禁用状态（AI正在回复时）：置灰并降低透明度 */
.chat-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
}
</style>