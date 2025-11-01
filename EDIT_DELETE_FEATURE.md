# 编辑模式卡片删除和编辑功能实现指南

## 功能说明
在编辑模式下，每个卡片右上角显示**编辑**和**删除**按钮。

## 实现步骤

### 1. CardGrid.vue 修改（已完成）
文件路径：`web/src/components/CardGrid.vue`

**无需修改** - CardGrid组件已经包含以下功能：
- 编辑和删除按钮UI
- 事件发射：`@editCard` 和 `@deleteCard`
- CSS样式已添加

### 2. Home.vue 需要添加的内容

#### 2.1 在CardGrid组件监听事件（第84-88行）
```vue
<CardGrid 
  :cards="filteredCards" 
  :editMode="editMode"
  @cardsReordered="handleCardsReordered"
  @editCard="handleEditCard"
  @deleteCard="handleDeleteCard"
/>
```

#### 2.2 导入API函数（第328行）
```javascript
import { getMenus, getCards, getAds, getFriends, login, batchParseUrls, batchAddCards, getRandomWallpaper, batchUpdateCards, deleteCard, updateCard } from '../api';
```

#### 2.3 添加编辑卡片状态（第352行后添加）
```javascript
// 编辑卡片相关状态
const showEditCardModal = ref(false);
const editingCard = ref(null);
const editCardForm = ref({ title: '', url: '', logo_url: '', desc: '' });
```

#### 2.4 在友情链接弹窗后添加编辑卡片弹窗UI（第323行后添加）
```vue
<!-- 编辑卡片弹窗 -->
<div v-if="showEditCardModal" class="modal-overlay" @click="showEditCardModal = false">
  <div class="modal-content" @click.stop>
    <div class="modal-header">
      <h3>编辑卡片</h3>
      <button @click="showEditCardModal = false" class="close-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="batch-edit-field" style="margin-bottom: 15px;">
        <label>标题：</label>
        <input v-model="editCardForm.title" type="text" class="batch-input" placeholder="请输入标题" />
      </div>
      <div class="batch-edit-field" style="margin-bottom: 15px;">
        <label>链接：</label>
        <input v-model="editCardForm.url" type="text" class="batch-input" placeholder="请输入URL" />
      </div>
      <div class="batch-edit-field" style="margin-bottom: 15px;">
        <label>Logo：</label>
        <input v-model="editCardForm.logo_url" type="text" class="batch-input" placeholder="请输入Logo URL（可选）" />
      </div>
      <div class="batch-edit-field" style="margin-bottom: 15px;">
        <label>描述：</label>
        <textarea v-model="editCardForm.desc" class="batch-textarea" rows="3" placeholder="请输入描述（可选）"></textarea>
      </div>
      <div class="batch-actions" style="margin-top: 20px;">
        <button @click="showEditCardModal = false" class="btn btn-cancel">取消</button>
        <button @click="saveEditCard" class="btn btn-primary" :disabled="editLoading">
          {{ editLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</div>
```

#### 2.5 在cancelEdit函数后添加处理函数（第911行后添加）
```javascript
// 编辑卡片
function handleEditCard(card) {
  editingCard.value = card;
  editCardForm.value = {
    title: card.title,
    url: card.url,
    logo_url: card.logo_url || '',
    desc: card.desc || ''
  };
  showEditCardModal.value = true;
}

// 保存编辑卡片
async function saveEditCard() {
  if (!editCardForm.value.title || !editCardForm.value.url) {
    alert('标题和链接不能为空');
    return;
  }
  
  editLoading.value = true;
  
  try {
    await updateCard(editingCard.value.id, {
      ...editingCard.value,
      ...editCardForm.value
    });
    alert('修改成功');
    showEditCardModal.value = false;
    await loadCards(); // 重新加载卡片
  } catch (error) {
    alert('修改失败：' + (error.response?.data?.error || error.message));
  } finally {
    editLoading.value = false;
  }
}

// 删除卡片
async function handleDeleteCard(card) {
  if (!confirm(`确定要删除「${card.title}」吗？`)) {
    return;
  }
  
  try {
    await deleteCard(card.id);
    alert('删除成功');
    await loadCards(); // 重新加载卡片
  } catch (error) {
    alert('删除失败：' + (error.response?.data?.error || error.message));
  }
}
```

## 使用方法
1. 点击FAB菜单中的"编辑模式"按钮
2. 输入管理员密码进入编辑模式
3. 每个卡片右上角会显示编辑和删除按钮
4. 点击编辑按钮修改卡片信息
5. 点击删除按钮删除卡片
6. 拖拽卡片调整顺序后点击"保存"

## 注意事项
- 编辑和删除操作需要已登录（编辑模式已验证密码）
- 删除操作不可恢复，请谨慎操作
- 编辑卡片后会自动刷新卡片列表
