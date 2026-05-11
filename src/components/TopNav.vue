<template>
  <header class="top-nav">
    <div class="search-section">
      <div class="search-input">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="搜索检测报告、委托单或客户信息..." />
      </div>
    </div>

    <div class="util-section">
      <div class="icon-wrapper">
        <div class="icon-btn" @click.stop="toggleNotifications" :class="{ active: showNotifications }">
          <i class="fa-regular fa-bell"></i>
          <span class="badge" v-if="unreadCount > 0"></span>
        </div>

        <transition name="fade-slide">
          <div class="dropdown-panel" v-if="showNotifications" @click.stop>
            <div class="dropdown-header">
              <h3>系统通知</h3>
              <span class="action-text" @click="markAllAsRead" v-if="unreadCount > 0">全部已读</span>
              <span class="action-text disabled" v-else>暂无未读</span>
            </div>

            <ul class="notification-list">
              <li v-for="item in notifications" :key="item.id"
                  class="notify-item" :class="{ unread: !item.read }"
                  @click="openNotificationDetail(item)">
                <div class="notify-icon primary"><i :class="item.icon"></i></div>
                <div class="notify-content">
                  <p class="notify-title">{{ item.title }}</p>
                  <p class="notify-time">{{ item.time }}</p>
                </div>
                <div class="unread-dot" v-if="!item.read"></div>
              </li>
            </ul>

            <div class="dropdown-footer" @click="openModal">查看全部通知</div>
          </div>
        </transition>
      </div>

      <div class="icon-wrapper">
        <div class="icon-btn" @click.stop="toggleSettings" :class="{ active: showSettings }">
          <i class="fa-solid fa-gear"></i>
        </div>

        <transition name="fade-slide">
          <div class="dropdown-panel settings-panel" v-if="showSettings" @click.stop>
            <div class="dropdown-header">
              <h3>账户设置</h3>
            </div>
            <div class="settings-list">
              <div class="setting-item action-btn" @click="openAccountModal">
                <i class="fa-solid fa-id-card-clip"></i> 查看与修改信息
              </div>
              <div class="setting-item action-btn">
                <i class="fa-solid fa-right-left"></i> 更换账号
              </div>
              <div class="setting-divider"></div>
              <div class="setting-item action-btn text-danger">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> 退出登录
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div class="profile">
        <div class="info">
          <span class="role">{{ accountInfo.role }}</span>
          <span class="name">{{ accountInfo.name }}</span>
        </div>
        <div class="avatar">
          <i class="fa-solid fa-user-check"></i>
        </div>
      </div>
    </div>
  </header>

  <transition name="fade">
    <div class="modal-overlay" v-if="showModal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>全部系统通知</h2>
          <div class="close-btn" @click="closeModal"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="modal-body">
          <ul class="full-notification-list">
            <li v-for="item in notifications" :key="'modal-'+item.id"
                class="full-notify-item"
                @click="openNotificationDetail(item)">
              <div class="notify-icon primary"><i :class="item.icon"></i></div>
              <div class="notify-content">
                <p class="notify-title" :class="{ 'is-read': item.read }">{{ item.title }}</p>
                <p class="notify-detail-preview">{{ item.detail }}</p>
                <p class="notify-time">{{ item.time }}</p>
              </div>
              <span class="status-tag" v-if="!item.read">未读</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </transition>

  <transition name="fade">
    <div class="modal-overlay" style="z-index: 10005;" v-if="selectedNotification" @click="closeNotificationDetail">
      <div class="modal-content detail-content" @click.stop>
        <div class="modal-header">
          <h2>通知详情</h2>
          <div class="close-btn" @click="closeNotificationDetail"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="modal-body">
          <div class="detail-header-info">
            <div class="notify-icon primary"><i :class="selectedNotification.icon"></i></div>
            <div>
              <h3 class="detail-title">{{ selectedNotification.title }}</h3>
              <p class="detail-time">{{ selectedNotification.time }}</p>
            </div>
          </div>
          <div class="detail-text">
            {{ selectedNotification.detail }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="closeNotificationDetail">我知道了</button>
        </div>
      </div>
    </div>
  </transition>

  <transition name="fade">
    <div class="modal-overlay" v-if="showAccountModal" @click="closeAccountModal">
      <div class="modal-content account-content" @click.stop>
        <div class="modal-header">
          <h2>账户信息设置</h2>
          <div class="close-btn" @click="closeAccountModal"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="modal-body form-body">
          <div class="form-group">
            <label>真实姓名:</label>
            <input type="text" v-model="tempAccountInfo.name" class="form-control" />
          </div>
          <div class="form-group">
            <label>系统角色:</label>
            <input type="text" v-model="tempAccountInfo.role" class="form-control disabled" disabled />
          </div>
          <div class="form-group">
            <label>工作邮箱:</label>
            <input type="email" v-model="tempAccountInfo.email" class="form-control" />
          </div>
          <div class="form-group">
            <label>联系电话:</label>
            <input type="text" v-model="tempAccountInfo.phone" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAccountModal">取消</button>
          <button class="btn-primary" @click="saveAccountInfo">保存修改</button>
        </div>
      </div>
    </div>
  </transition>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const showNotifications = ref(false)
const showSettings = ref(false)
const showModal = ref(false)
const showAccountModal = ref(false)
const selectedNotification = ref(null)

// 账户信息数据
const accountInfo = ref({
  name: '华测工程师',
  role: '高级审核员',
  email: 'engineer@cti-cert.com',
  phone: '13888888888'
})
// 临时数据，用于弹窗编辑，点保存才生效
const tempAccountInfo = ref({ ...accountInfo.value })

// 通知数据
const notifications = ref([
  {
    id: 1,
    icon: 'fa-solid fa-screwdriver-wrench',
    title: '系统停机维护通知',
    detail: '为了提供更优质的服务，系统将于本周六凌晨 2:00 - 4:00 进行例行升级维护。期间平台将暂停访问，所有后台计算任务会暂停并在恢复后继续执行，请提前安排好数据上传和报告导出工作。',
    time: '10 分钟前',
    read: false
  },
  {
    id: 2,
    icon: 'fa-solid fa-cloud-arrow-up',
    title: 'AI 业务平台 V4.0 更新说明',
    detail: '本次更新优化了现场数据采集的回填逻辑，并修复了部分计算书解析报错的问题。新增了技术方案与报价规则的联动检查，详情请查阅系统帮助文档。',
    time: '2 小时前',
    read: false
  },
  {
    id: 3,
    icon: 'fa-solid fa-shield-halved',
    title: '系统安全策略升级规范',
    detail: '为了保障客户数据安全，即日起对导出 PDF 报告的权限进行了复核机制升级。所有包含敏感客户信息的原始记录和最终报告，需经过二级密码校验方可进行本地下载操作。',
    time: '昨天 14:30',
    read: true
  }
])

// 计算未读消息数量
const unreadCount = computed(() => notifications.value.filter(item => !item.read).length)

// 全部已读方法
const markAllAsRead = () => {
  notifications.value.forEach(item => item.read = true)
}

// 切换面板方法
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) showSettings.value = false
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
  if (showSettings.value) showNotifications.value = false
}

// 全部通知弹窗控制
const openModal = () => {
  showModal.value = true
  showNotifications.value = false
}
const closeModal = () => {
  showModal.value = false
}

// 单条通知详情弹窗控制
const openNotificationDetail = (item) => {
  item.read = true // 点击即标记为已读
  selectedNotification.value = item
  showNotifications.value = false // 关闭下拉面板
}
const closeNotificationDetail = () => {
  selectedNotification.value = null
}

// 账户信息弹窗控制
const openAccountModal = () => {
  tempAccountInfo.value = { ...accountInfo.value } // 每次打开时重置为当前数据
  showAccountModal.value = true
  showSettings.value = false
}
const closeAccountModal = () => {
  showAccountModal.value = false
}
const saveAccountInfo = () => {
  accountInfo.value = { ...tempAccountInfo.value } // 保存数据
  showAccountModal.value = false
}

// 点击空白关闭下拉
const closeDropdowns = () => {
  showNotifications.value = false
  showSettings.value = false
}

onMounted(() => document.addEventListener('click', closeDropdowns))
onUnmounted(() => document.removeEventListener('click', closeDropdowns))
</script>

<style scoped>
.top-nav {
  height: 80px;
  background: #FFFFFF;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.05);
  z-index: 99;
}

.search-input {
  background: #F1F5F9;
  padding: 10px 24px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  width: 400px;
  border: 1px solid transparent;
  transition: all 0.3s;
}

.search-input:focus-within {
  background: #FFFFFF;
  border-color: #2A3F7A;
  box-shadow: 0 0 0 4px rgba(42, 63, 122, 0.1);
}

.search-input i { color: #94A3B8; margin-right: 12px; }
.search-input input { border: none; background: none; outline: none; width: 100%; font-size: 14px; }

.util-section { display: flex; align-items: center; gap: 24px; }
.icon-wrapper { position: relative; }

.icon-btn {
  font-size: 20px;
  color: #64748B;
  cursor: pointer;
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: 0.3s;
}

.icon-btn:hover, .icon-btn.active {
  background: #F1F5F9;
  color: #2A3F7A;
}

.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #E30012;
  border-radius: 50%;
  border: 2px solid #FFF;
}

/* ---------------- 下拉面板基础样式 ---------------- */
.dropdown-panel {
  position: absolute;
  top: 50px;
  right: -10px;
  width: 320px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #F1F5F9;
  z-index: 100;
  overflow: hidden;
  cursor: default;
}

.settings-panel { width: 220px; }

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F1F5F9;
}

.dropdown-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.action-text {
  font-size: 13px;
  color: #2A3F7A;
  cursor: pointer;
}
.action-text:hover { opacity: 0.8; }
.action-text.disabled { color: #94A3B8; cursor: not-allowed; }

/* ---------------- 通知列表样式 ---------------- */
.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 360px;
  overflow-y: auto;
}

.notify-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid #F8FAFC;
  transition: background 0.2s;
  cursor: pointer;
  position: relative;
}

.notify-item:hover { background: #F8FAFC; }
.notify-item.unread { background: #F4F7FB; }

.notify-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
  flex-shrink: 0;
}
.notify-icon.primary { background: rgba(42, 63, 122, 0.1); color: #2A3F7A; }

.notify-content {
  flex: 1;
  text-align: left;
}
.notify-title { font-size: 14px; color: #1E293B; margin: 0 0 4px 0; font-weight: 500; }
.notify-time { font-size: 12px; color: #94A3B8; margin: 0; }

.unread-dot {
  width: 6px;
  height: 6px;
  background: #E30012;
  border-radius: 50%;
  position: absolute;
  right: 20px;
  top: 24px;
}

.dropdown-footer {
  text-align: center;
  padding: 14px;
  font-size: 14px;
  color: #2A3F7A;
  cursor: pointer;
  border-top: 1px solid #F1F5F9;
  font-weight: 500;
}
.dropdown-footer:hover { background: #F8FAFC; }

/* ---------------- 设置列表样式 ---------------- */
.settings-list { padding: 8px 0; }
.setting-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  font-size: 14px;
  color: #475569;
}
.setting-item.action-btn {
  justify-content: flex-start;
  cursor: pointer;
  gap: 12px;
  transition: background 0.2s;
}
.setting-item.action-btn:hover { background: #F8FAFC; color: #1E293B; }
.setting-item.text-danger { color: #EF4444; }
.setting-item.text-danger:hover { color: #DC2626; background: #FEF2F2; }
.setting-divider { height: 1px; background: #F1F5F9; margin: 4px 0; }

/* ---------------- 弹窗全局 (Modal) 样式 ---------------- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: #FFFFFF;
  width: 600px;
  max-width: 90%;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.account-content { width: 450px; }
.detail-content { width: 500px; }

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h2 { font-size: 18px; font-weight: 700; color: #1E293B; margin: 0; }

.close-btn {
  width: 32px; height: 32px;
  background: #F1F5F9;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #64748B; cursor: pointer; transition: 0.3s;
}
.close-btn:hover { background: #E2E8F0; color: #1E293B; }

.modal-body { padding: 24px; overflow-y: auto; }
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #F1F5F9;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 按钮样式 */
.btn-cancel, .btn-primary {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  font-weight: 500;
  transition: 0.2s;
}
.btn-cancel { background: #F1F5F9; color: #64748B; }
.btn-cancel:hover { background: #E2E8F0; color: #1E293B; }
.btn-primary { background: #2A3F7A; color: #FFFFFF; }
.btn-primary:hover { background: #1f2f5c; }

/* ---------------- 账户信息表单样式 ---------------- */
.form-body { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 14px; color: #475569; font-weight: 500; text-align: left;width: 100%;}
.form-control {
  padding: 10px 14px;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.form-control:focus { border-color: #2A3F7A; }
.form-control.disabled { background: #F8FAFC; color: #94A3B8; cursor: not-allowed; }

/* ---------------- 详情弹窗样式 ---------------- */
.detail-header-info { display: flex; align-items: center; margin-bottom: 20px; gap: 16px; }
.detail-title { font-size: 18px; color: #1E293B; margin: 0 0 6px 0; font-weight: 600; }
.detail-time { font-size: 13px; color: #94A3B8; margin: 0; text-align: left;}
.detail-text { font-size: 15px; color: #475569; line-height: 1.6; background: #F8FAFC; padding: 16px; border-radius: 8px;text-align: left;}

/* ---------------- 全部通知列表样式 ---------------- */
.full-notification-list { list-style: none; padding: 0; margin: 0; }
.full-notify-item {
  display: flex; padding: 20px 0; border-bottom: 1px solid #F1F5F9; position: relative; cursor: pointer; transition: background 0.2s; border-radius: 8px; padding: 16px;
}
.full-notify-item:hover { background: #F8FAFC; }
.notify-detail-preview { font-size: 14px; color: #64748B; line-height: 1.5; margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;}
.is-read { color: #94A3B8; }
.status-tag { position: absolute; top: 16px; right: 16px; background: #FEF2F2; color: #E30012; font-size: 12px; padding: 4px 8px; border-radius: 4px; font-weight: 600; }

/* ---------------- 过渡动画 ---------------- */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 用户信息区域 */
.profile { display: flex; align-items: center; gap: 16px; padding-left: 24px; border-left: 2px solid #F1F5F9; }
.info { display: flex; flex-direction: column; text-align: center; }
.role { font-size: 11px; color: #94A3B8; font-weight: 600; }
.name { font-size: 14px; color: #1E293B; font-weight: 700; }
.avatar { width: 40px; height: 40px; background: #2A3F7A; color: #FFF; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; }


/* ====== 覆盖全局样式，单独去除顶部搜索栏的背景和边框 ====== */
.search-input {
  background-color: transparent !important; /* 去除外层容器的背景色 */
}

.search-input input {
  border: none !important;                  /* 去除全局强制加上的边框 */
  padding-left: 8px !important;             /* 微调一下文字与放大镜图标的间距 */
}


</style>