# 拖拽排序和分类功能实现指南

## 已完成部分

### 1. ✅ 后端API
- 文件：`routes/card.js`
- 新增接口：`PATCH /api/cards/batch-update`
- 功能：批量更新卡片的order、menu_id、sub_menu_id
- 使用事务确保数据一致性

### 2. ✅ 前端依赖
- 已在`web/package.json`中添加`sortablejs@1.15.3`
- 已执行`npm install`安装依赖

### 3. ✅ 前端API封装
- 文件：`web/src/api.js`
- 新增方法：`batchUpdateCards(cards)`
- 调用后端批量更新接口

### 4. ✅ CardGrid组件改造
- 文件：`web/src/components/CardGrid.vue`
- 集成Sortable.js
- 添加editMode属性控制拖拽启用
- 添加cardsReordered事件通知父组件
- 添加拖拽相关CSS样式

## 待完成部分（需要在Home.vue中实现）

### 5. 编辑模式状态管理

在`<script setup>`中添加：

```javascript
import { batchUpdateCards } from '../api';

// 编辑模式相关状态
const editMode = ref(false);
const editPassword = ref('');
const showEditPasswordModal = ref(false);
const originalCards = ref([]); // 保存原始卡片数据用于取消操作
const pendingChanges = ref([]); // 待保存的更改
const editLoading = ref(false);
const editError = ref('');

// 进入编辑模式
async function enterEditMode() {
  showEditPasswordModal.value = true;
  editPassword.value = '';
  editError.value = '';
}

// 验证密码并进入编辑模式
async function verifyEditPassword() {
  if (!editPassword.value) {
    editError.value = '请输入密码';
    return;
  }
  
  editLoading.value = true;
  editError.value = '';
  
  try {
    const res = await login('admin', editPassword.value);
    localStorage.setItem('token', res.data.token);
    
    // 保存原始卡片数据
    originalCards.value = JSON.parse(JSON.stringify(cards.value));
    
    // 进入编辑模式
    editMode.value = true;
    showEditPasswordModal.value = false;
    editLoading.value = false;
  } catch (error) {
    editError.value = '密码错误';
    editLoading.value = false;
  }
}

// 卡片重新排序处理
function handleCardsReordered(reorderedCards) {
  // 更新卡片order
  cards.value = reorderedCards.map((card, index) => ({
    ...card,
    order: index
  }));
  
  // 记录更改
  pendingChanges.value = cards.value.map((card, index) => ({
    id: card.id,
    order: index,
    menu_id: card.menu_id || activeMenu.value.id,
    sub_menu_id: card.sub_menu_id || activeSubMenu.value?.id || null
  }));
}

// 保存更改
async function saveChanges() {
  if (pendingChanges.value.length === 0) {
    alert('没有需要保存的更改');
    return;
  }
  
  editLoading.value = true;
  
  try {
    await batchUpdateCards(pendingChanges.value);
    alert('保存成功');
    editMode.value = false;
    pendingChanges.value = [];
    await loadCards(); // 重新加载卡片
  } catch (error) {
    alert('保存失败：' + (error.response?.data?.error || error.message));
  } finally {
    editLoading.value = false;
  }
}

// 取消编辑
function cancelEdit() {
  if (pendingChanges.value.length > 0) {
    if (!confirm('有未保存的更改，确定要取消吗？')) {
      return;
    }
  }
  
  // 恢复原始数据
  cards.value = originalCards.value;
  editMode.value = false;
  pendingChanges.value = [];
}
```

### 6. 模板更新

#### 6.1 将CardGrid改为支持编辑模式

找到：
```html
<CardGrid :cards="filteredCards"/>
```

替换为：
```html
<CardGrid 
  :cards="filteredCards" 
  :editMode="editMode"
  @cardsReordered="handleCardsReordered"
/>
```

#### 6.2 在FAB按钮附近添加编辑模式按钮

在FAB容器内添加：
```html
<!-- 编辑模式按钮 -->
<transition name="fab-item">
  <button 
    v-if="!editMode" 
    v-show="showFabMenu" 
    @click="enterEditMode" 
    class="edit-mode-btn" 
    title="编辑模式"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  </button>
</transition>
```

#### 6.3 添加编辑工具栏

在search-section之后添加：
```html
<!-- 编辑模式工具栏 -->
<transition name="fade">
  <div v-if="editMode" class="edit-toolbar">
    <div class="edit-toolbar-content">
      <div class="edit-info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span>编辑模式：拖拽卡片可调整顺序</span>
        <span v-if="pendingChanges.length > 0" class="changes-count">
          ({{ pendingChanges.length }} 项更改)
        </span>
      </div>
      <div class="edit-actions">
        <button @click="cancelEdit" class="btn btn-cancel" :disabled="editLoading">
          取消
        </button>
        <button 
          @click="saveChanges" 
          class="btn btn-primary" 
          :disabled="editLoading || pendingChanges.length === 0"
        >
          {{ editLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</transition>
```

#### 6.4 添加密码验证弹窗

在友情链接弹窗之后添加：
```html
<!-- 编辑模式密码验证弹窗 -->
<div v-if="showEditPasswordModal" class="modal-overlay" @click="showEditPasswordModal = false">
  <div class="modal-content" @click.stop>
    <div class="modal-header">
      <h3>进入编辑模式</h3>
      <button @click="showEditPasswordModal = false" class="close-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <p style="margin-bottom: 15px;">请输入管理员密码以继续：</p>
      <input 
        v-model="editPassword" 
        type="password" 
        placeholder="请输入管理员密码"
        class="batch-input"
        @keyup.enter="verifyEditPassword"
        style="width: 100%;"
      />
      <p v-if="editError" class="batch-error">{{ editError }}</p>
      <div class="batch-actions" style="margin-top: 20px;">
        <button @click="showEditPasswordModal = false" class="btn btn-cancel">取消</button>
        <button @click="verifyEditPassword" class="btn btn-primary" :disabled="editLoading">
          {{ editLoading ? '验证中...' : '确认' }}
        </button>
      </div>
    </div>
  </div>
</div>
```

### 7. 样式更新

在`<style scoped>`中添加：

```css
/* 编辑工具栏 */
.edit-toolbar {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 15px 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 800px;
  width: 90%;
}

.edit-toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.edit-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #3b82f6;
  font-weight: 500;
}

.edit-info svg {
  flex-shrink: 0;
}

.changes-count {
  color: #ef4444;
  font-weight: 600;
}

.edit-actions {
  display: flex;
  gap: 10px;
}

.edit-mode-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.edit-mode-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .edit-toolbar {
    top: 60px;
    padding: 12px 15px;
  }
  
  .edit-toolbar-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .edit-info {
    font-size: 14px;
  }
  
  .edit-actions {
    width: 100%;
  }
  
  .edit-actions button {
    flex: 1;
  }
}
```

## 使用说明

1. 用户点击FAB菜单中的"编辑模式"按钮
2. 弹出密码验证窗口
3. 输入管理员密码后进入编辑模式
4. 在编辑模式下，卡片可以拖拽排序
5. 拖拽后，顶部工具栏显示待保存的更改数量
6. 点击"保存"按钮批量提交更改
7. 点击"取消"按钮退出编辑模式并恢复原始顺序

## 后续增强（可选）

### 跨菜单拖拽分类
如需实现将卡片拖拽到不同菜单/子菜单，需要：
1. 在MenuBar组件上添加拖放区域
2. 使用Sortable的group选项实现跨容器拖拽
3. 更新handleCardsReordered函数处理menu_id和sub_menu_id的变化

详细实现方案见后续文档。

## 提交说明

```bash
git add .
git commit -m "feat: 添加卡片拖拽排序功能

- 后端：新增批量更新卡片接口
- 前端：集成Sortable.js实现拖拽排序
- 添加编辑模式状态管理
- 需要管理员密码验证
- 支持保存和取消操作
- 使用事务确保数据一致性"
```
