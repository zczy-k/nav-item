<template>
  <div class="backup-manage">
    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', { active: activeTab === 'local' }]" @click="activeTab = 'local'">
        📦 本地备份
      </button>
      <button :class="['tab', { active: activeTab === 'webdav' }]" @click="activeTab = 'webdav'">
        ☁️ WebDAV备份
      </button>
    </div>

    <!-- Local Backup Tab -->
    <div v-show="activeTab === 'local'" class="tab-content">
      <div class="toolbar">
      <button class="btn btn-primary" @click="createBackup" :disabled="loading.create">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {{ loading.create ? '备份中...' : '创建备份' }}
      </button>
      <button class="btn btn-secondary" @click="loadBackupList" :disabled="loading.list">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 4v6h6M23 20v-6h-6"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
        {{ loading.list ? '刷新中...' : '刷新列表' }}
      </button>
    </div>

    <div v-if="message.text" :class="['message', message.type]">
      {{ message.text }}
    </div>

    <div class="backup-list">
      <div v-if="backups.length === 0 && !loading.list" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p>暂无备份文件</p>
      </div>

      <div v-else class="backup-grid">
        <div v-for="backup in backups" :key="backup.name" class="backup-card">
          <div class="backup-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2566d8" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="backup-info">
            <div class="backup-name">{{ backup.name }}</div>
            <div class="backup-meta">
              <span class="backup-size">{{ backup.size }}</span>
              <span class="backup-date">{{ formatDate(backup.created) }}</span>
            </div>
          </div>
          <div class="backup-actions">
             <button class="btn-icon btn-restore" @click="confirmAction('restore', backup.name)" title="恢复备份">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
            <button class="btn-icon" @click="downloadBackup(backup.name)" title="下载备份">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            </button>
            <button class="btn-icon btn-danger" @click="confirmAction('delete', backup.name)" title="删除备份">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- WebDAV Backup Tab -->
    <div v-show="activeTab === 'webdav'" class="tab-content">
      <div class="toolbar">
        <button class="btn btn-primary" @click="showWebdavConfig = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
          </svg>
          WebDAV配置
        </button>
        <button class="btn btn-primary" @click="backupToWebdav" :disabled="loading.webdavBackup || !webdavConfig.configured">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
          {{ loading.webdavBackup ? '备份中...' : '备份到WebDAV' }}
        </button>
        <button class="btn btn-secondary" @click="loadWebdavBackupList" :disabled="loading.webdavList || !webdavConfig.configured">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          {{ loading.webdavList ? '刷新中...' : '刷新列表' }}
        </button>
      </div>

      <div v-if="message.text" :class="['message', message.type]">
        {{ message.text }}
      </div>

      <div v-if="!webdavConfig.configured" class="info-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2566d8" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p>请先配置WebDAV连接信息（支持：坚果云、Nextcloud、阿里云盘WebDAV、Dropbox等）</p>
      </div>

      <div class="backup-list">
        <div v-if="webdavBackups.length === 0 && !loading.webdavList" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <p>暂无WebDAV备份</p>
        </div>

        <div v-else class="backup-grid">
          <div v-for="backup in webdavBackups" :key="backup.name" class="backup-card">
            <div class="backup-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M12 18v-6M9 15l3 3 3-3"/>
              </svg>
            </div>
            <div class="backup-info">
              <div class="backup-name">{{ backup.name }}</div>
              <div class="backup-meta">
                <span class="backup-size">{{ backup.size }}</span>
                <span class="backup-date">{{ formatDate(backup.created) }}</span>
              </div>
            </div>
            <div class="backup-actions">
              <button class="btn-icon btn-restore" @click="confirmAction('webdav-restore', backup.name)" title="从WebDAV恢复">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 4v6h6M23 20v-6h-6"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </button>
              <button class="btn-icon btn-danger" @click="confirmAction('webdav-delete', backup.name)" title="删除WebDAV备份">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WebDAV配置对话框 -->
    <div v-if="showWebdavConfig" class="modal-overlay">
      <div class="modal-content config-modal">
        <h3>WebDAV配置</h3>
        <div class="form-group">
          <label>WebDAV URL <span class="required">*</span></label>
          <input type="text" v-model="webdavConfigForm.url" placeholder="https://dav.jianguoyun.com/dav/" class="form-input" />
          <small>例：坚果云 https://dav.jianguoyun.com/dav/</small>
        </div>
        <div class="form-group">
          <label>用户名 <span class="required">*</span></label>
          <input type="text" v-model="webdavConfigForm.username" placeholder="邮箱或用户名" class="form-input" />
        </div>
        <div class="form-group">
          <label>密码 <span class="required">*</span></label>
          <input type="password" v-model="webdavConfigForm.password" placeholder="应用密码或访问令牌" class="form-input" />
          <small>注意：某些服务需要使用应用专用密码，而不是登录密码</small>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showWebdavConfig = false">取消</button>
          <button class="btn btn-primary" @click="saveWebdavConfig" :disabled="loading.webdavConfig">
            {{ loading.webdavConfig ? '测试连接中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认对话框 -->
    <div v-if="dialog.show" class="modal-overlay">
      <div class="modal-content">
        <h3>确认{{ dialog.title }}</h3>
        <p>{{ dialog.message }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="dialog.show = false">取消</button>
          <button :class="['btn', dialog.confirmClass]" @click="executeAction">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';

const activeTab = ref('local');
const backups = ref([]);
const webdavBackups = ref([]);
const showWebdavConfig = ref(false);

const loading = reactive({
  create: false,
  list: false,
  delete: false,
  restore: false,
  webdavConfig: false,
  webdavBackup: false,
  webdavList: false,
  webdavRestore: false,
  webdavDelete: false
});

const message = ref({ text: '', type: '' });

const dialog = reactive({
  show: false,
  filename: '',
  action: null,
  title: '',
  message: '',
  confirmClass: ''
});

const webdavConfig = reactive({
  configured: false,
  url: '',
  username: ''
});

const webdavConfigForm = reactive({
  url: '',
  username: '',
  password: ''
});

const token = localStorage.getItem('token');

// 统一API请求
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

const showMessage = (text, type = 'success') => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: '', type: '' };
  }, 3000);
};

const createBackup = async () => {
  loading.create = true;
  const data = await apiRequest('/api/backup/create', { method: 'POST' });
  if (data.success) {
    showMessage('备份创建成功！');
    await loadBackupList();
  } else {
    showMessage(data.message || '备份创建失败', 'error');
  }
  loading.create = false;
};

const loadBackupList = async () => {
  loading.list = true;
  const data = await apiRequest('/api/backup/list');
  if (data.success) {
    backups.value = data.backups;
  } else {
    showMessage('获取备份列表失败', 'error');
  }
  loading.list = false;
};

const downloadBackup = (filename) => {
  window.open(`/api/backup/download/${filename}?token=${token}`, '_blank');
};

const confirmAction = (action, filename) => {
  dialog.show = true;
  dialog.filename = filename;
  dialog.action = action;
  
  if (action === 'delete') {
    dialog.title = '删除';
    dialog.message = `确定要删除备份文件 ${filename} 吗？`;
    dialog.confirmClass = 'btn-danger';
  } else if (action === 'restore') {
    dialog.title = '恢复';
    dialog.message = `确定要恢复备份文件 ${filename} 吗？`;
    dialog.confirmClass = 'btn-restore';
  } else if (action === 'webdav-restore') {
    dialog.title = '从WebDAV恢复';
    dialog.message = `确定要从WebDAV恢复备份 ${filename} 吗？这将覆盖当前数据。`;
    dialog.confirmClass = 'btn-restore';
  } else if (action === 'webdav-delete') {
    dialog.title = '删除WebDAV备份';
    dialog.message = `确定要删除WebDAV备份 ${filename} 吗？`;
    dialog.confirmClass = 'btn-danger';
  }
};

const executeAction = async () => {
  const { action, filename } = dialog;
  dialog.show = false;

  if (action === 'delete') {
    loading.delete = true;
    const data = await apiRequest(`/api/backup/delete/${filename}`, { method: 'DELETE' });
    if (data.success) {
      showMessage('删除成功！');
      await loadBackupList();
    } else {
      showMessage(data.message || '删除失败', 'error');
    }
    loading.delete = false;
  } else if (action === 'restore') {
    loading.restore = true;
    const data = await apiRequest(`/api/backup/restore/${filename}`, { method: 'POST' });
    if (data.success) {
      showMessage('恢复成功！');
      await loadBackupList();
    } else {
      showMessage(data.message || '恢复失败', 'error');
    }
    loading.restore = false;
  } else if (action === 'webdav-restore') {
    await restoreFromWebdav(filename);
  } else if (action === 'webdav-delete') {
    await deleteWebdavBackup(filename);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { hour12: false });
};

// WebDAV functions
const loadWebdavConfig = async () => {
  const data = await apiRequest('/api/backup/webdav/config');
  if (data.success && data.config) {
    webdavConfig.configured = data.config.configured;
    webdavConfig.url = data.config.url || '';
    webdavConfig.username = data.config.username || '';
  }
};

const saveWebdavConfig = async () => {
  if (!webdavConfigForm.url || !webdavConfigForm.username || !webdavConfigForm.password) {
    showMessage('请填写完整的WebDAV配置信息', 'error');
    return;
  }
  loading.webdavConfig = true;
  const data = await apiRequest('/api/backup/webdav/config', {
    method: 'POST',
    body: JSON.stringify(webdavConfigForm)
  });
  if (data.success) {
    showMessage('WebDAV配置保存成功！');
    showWebdavConfig.value = false;
    webdavConfigForm.url = '';
    webdavConfigForm.username = '';
    webdavConfigForm.password = '';
    await loadWebdavConfig();
  } else {
    showMessage(data.message || 'WebDAV配置保存失败', 'error');
  }
  loading.webdavConfig = false;
};

const backupToWebdav = async () => {
  loading.webdavBackup = true;
  const data = await apiRequest('/api/backup/webdav/backup', { method: 'POST' });
  if (data.success) {
    showMessage('备份到WebDAV成功！');
    await loadWebdavBackupList();
  } else {
    showMessage(data.message || '备份到WebDAV失败', 'error');
  }
  loading.webdavBackup = false;
};

const loadWebdavBackupList = async () => {
  loading.webdavList = true;
  const data = await apiRequest('/api/backup/webdav/list');
  if (data.success) {
    webdavBackups.value = data.backups || [];
  } else {
    showMessage('获取WebDAV备份列表失败', 'error');
  }
  loading.webdavList = false;
};

const restoreFromWebdav = async (filename) => {
  loading.webdavRestore = true;
  const data = await apiRequest('/api/backup/webdav/restore', {
    method: 'POST',
    body: JSON.stringify({ filename })
  });
  if (data.success) {
    showMessage('从WebDAV恢复成功！');
  } else {
    showMessage(data.message || '从WebDAV恢复失败', 'error');
  }
  loading.webdavRestore = false;
};

const deleteWebdavBackup = async (filename) => {
  loading.webdavDelete = true;
  const data = await apiRequest(`/api/backup/webdav/delete/${filename}`, { method: 'DELETE' });
  if (data.success) {
    showMessage('删除成功！');
    await loadWebdavBackupList();
  } else {
    showMessage(data.message || '删除失败', 'error');
  }
  loading.webdavDelete = false;
};

onMounted(async () => {
  await loadBackupList();
  await loadWebdavConfig();
  if (webdavConfig.configured) {
    await loadWebdavBackupList();
  }
});
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e3e6ef;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.tab:hover {
  color: #2566d8;
}

.tab.active {
  color: #2566d8;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #2566d8;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-restore {
  color: #27ae60;
}

.btn-restore:hover {
  background: #e9f7ef;
}

.backup-manage {
  width: 100%;
  max-width: 1200px;
  padding: 24px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #2566d8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #174ea6;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #999;
}

.empty-state p {
  margin-top: 16px;
  font-size: 16px;
}

.backup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.backup-card {
  background: white;
  border: 1px solid #e3e6ef;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.backup-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.backup-icon {
  flex-shrink: 0;
}

.backup-info {
  flex: 1;
  min-width: 0;
}

.backup-name {
  font-size: 14px;
  font-weight: 500;
  color: #222;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.btn-danger {
  color: #e74c3c;
}

.btn-danger:hover {
  background: #fee;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #222;
}

.modal-content p {
  margin: 0 0 24px 0;
  color: #666;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.config-modal {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.required {
  color: #e74c3c;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e3e6ef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #2566d8;
}

.info-box {
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-box p {
  margin: 0;
  color: #1565c0;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .backup-manage {
    padding: 16px;
  }
  
  .backup-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-wrap: wrap;
  }
  
  .tabs {
    overflow-x: auto;
  }
}
</style>
