<template>
  <div class="backup-manage">
    <div class="toolbar">
      <button class="btn btn-primary" @click="createBackup" :disabled="loading">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {{ loading ? '备份中...' : '创建备份' }}
      </button>
      <button class="btn btn-secondary" @click="loadBackupList">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 4v6h6M23 20v-6h-6"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
        刷新列表
      </button>
    </div>

    <div v-if="message.text" :class="['message', message.type]">
      {{ message.text }}
    </div>

    <div class="backup-list">
      <div v-if="backups.length === 0 && !loading" class="empty-state">
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
            <button class="btn-icon" @click="downloadBackup(backup.name)" title="下载备份">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            </button>
            <button class="btn-icon btn-danger" @click="confirmDelete(backup.name)" title="删除备份">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="deleteDialog.show" class="modal-overlay">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除备份文件 <strong>{{ deleteDialog.filename }}</strong> 吗？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteDialog.show = false">取消</button>
          <button class="btn btn-danger" @click="deleteBackup">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const backups = ref([]);
const loading = ref(false);
const message = ref({ text: '', type: '' });
const deleteDialog = ref({
  show: false,
  filename: ''
});

const token = localStorage.getItem('token');

const showMessage = (text, type = 'success') => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = { text: '', type: '' };
  }, 3000);
};

const createBackup = async () => {
  loading.value = true;
  message.value = { text: '', type: '' };
  
  try {
    const response = await fetch('/api/backup/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('备份创建成功！', 'success');
      await loadBackupList();
    } else {
      showMessage(data.message || '备份创建失败', 'error');
    }
  } catch (error) {
    console.error('创建备份失败:', error);
    showMessage('备份创建失败：' + error.message, 'error');
  } finally {
    loading.value = false;
  }
};

const loadBackupList = async () => {
  loading.value = true;
  
  try {
    const response = await fetch('/api/backup/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      backups.value = data.backups;
    } else {
      showMessage('获取备份列表失败', 'error');
    }
  } catch (error) {
    console.error('获取备份列表失败:', error);
    showMessage('获取备份列表失败：' + error.message, 'error');
  } finally {
    loading.value = false;
  }
};

const downloadBackup = (filename) => {
  window.open(`/api/backup/download/${filename}?token=${token}`, '_blank');
};

const confirmDelete = (filename) => {
  deleteDialog.value = {
    show: true,
    filename
  };
};

const deleteBackup = async () => {
  const filename = deleteDialog.value.filename;
  deleteDialog.value.show = false;
  
  try {
    const response = await fetch(`/api/backup/delete/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('备份删除成功', 'success');
      await loadBackupList();
    } else {
      showMessage(data.message || '备份删除失败', 'error');
    }
  } catch (error) {
    console.error('删除备份失败:', error);
    showMessage('删除备份失败：' + error.message, 'error');
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  loadBackupList();
});
</script>

<style scoped>
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

@media (max-width: 768px) {
  .backup-manage {
    padding: 16px;
  }
  
  .backup-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
  }
}
</style>
