<template>
  <div class="card-manage">
    <div class="card-header">
      <div class="header-content">
        <h2 class="page-title">管理网站导航卡片，支持主菜单和子菜单分类</h2>
      </div>
      <div class="card-add">
        <select v-model="selectedMenuId" class="input narrow" @change="onMenuChange">
          <option v-for="menu in menus" :value="menu.id" :key="menu.id">{{ menu.name }}</option>
        </select>
        <select v-model="selectedSubMenuId" class="input narrow" @change="onSubMenuChange">
          <option value="">主菜单</option>
          <option v-for="subMenu in currentSubMenus" :value="subMenu.id" :key="subMenu.id">{{ subMenu.name }}</option>
        </select>
        <input v-model="newCardTitle" placeholder="卡片标题" class="input narrow" />
        <input v-model="newCardUrl" placeholder="卡片链接" class="input wide" />
        <input v-model="newCardLogo" placeholder="logo链接(可选)" class="input wide" />
        <button class="btn" @click="addCard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          添加卡片
        </button>
      </div>
    </div>
    <div class="card-card">
      <table class="card-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>网址</th>
            <th>Logo链接</th>
            <th>描述</th>
            <th>标签</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="card in cards" :key="card.id">
            <td><input v-model="card.title" @blur="updateCard(card)" class="table-input" /></td>
            <td><input v-model="card.url" @blur="updateCard(card)" class="table-input" /></td>
            <td><input v-model="card.logo_url" @blur="updateCard(card)" class="table-input" placeholder="logo链接(可选)" /></td>
            <td><input v-model="card.desc" @blur="updateCard(card)" class="table-input" placeholder="描述（可选）" /></td>
            <td>
              <div class="tag-selector" @click="openTagSelector(card)">
                <div v-if="card.tags && card.tags.length > 0" class="selected-tags">
                  <span v-for="tag in card.tags" :key="tag.id" class="mini-tag" :style="{ backgroundColor: tag.color }">
                    {{ tag.name }}
                  </span>
                </div>
                <span v-else class="tag-placeholder">选择标签</span>
              </div>
            </td>
            <td><input v-model.number="card.order" type="number" @blur="updateCard(card)" class="table-input order-input" /></td>
            <td>
              <button class="btn btn-danger btn-icon" @click="deleteCard(card.id)" title="删除">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 标签选择弹窗 -->
    <div v-if="showTagModal" class="modal-overlay" @click="closeTagSelector">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>选择标签</h3>
          <button class="close-btn" @click="closeTagSelector">×</button>
        </div>
        <div class="modal-body">
          <div v-if="allTags.length === 0" class="empty-tags">
            <p>暂无标签，请先在标签管理页面创建</p>
          </div>
          <div v-else class="tag-options">
            <label v-for="tag in allTags" :key="tag.id" class="tag-option">
              <input 
                type="checkbox" 
                :checked="selectedTagIds.includes(tag.id)"
                @change="toggleTag(tag.id)"
              />
              <span class="tag-label" :style="{ backgroundColor: tag.color }">
                {{ tag.name }}
              </span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeTagSelector">取消</button>
          <button class="btn btn-primary" @click="saveCardTags">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { 
  getMenus, 
  getCards, 
  addCard as apiAddCard, 
  updateCard as apiUpdateCard, 
  deleteCard as apiDeleteCard,
  getTags
} from '../../api';

const menus = ref([]);
const cards = ref([]);
const selectedMenuId = ref();
const selectedSubMenuId = ref('');
const newCardTitle = ref('');
const newCardUrl = ref('');
const newCardLogo = ref('');
const allTags = ref([]);
const showTagModal = ref(false);
const currentEditCard = ref(null);
const selectedTagIds = ref([]);

const currentSubMenus = computed(() => {
  if (!selectedMenuId.value) return [];
  const menu = menus.value.find(m => m.id === selectedMenuId.value);
  return menu?.subMenus || [];
});

onMounted(async () => {
  const res = await getMenus();
  menus.value = res.data;
  if (menus.value.length) {
    selectedMenuId.value = menus.value[0].id;
    selectedSubMenuId.value = '';
  }
  
  // 加载标签
  const tagsRes = await getTags();
  allTags.value = tagsRes.data;
});

watch(selectedMenuId, () => {
  selectedSubMenuId.value = '';
  loadCards();
});

watch(selectedSubMenuId, loadCards);

function onMenuChange() {
  selectedSubMenuId.value = '';
}

function onSubMenuChange() {
  loadCards();
}

async function loadCards() {
  if (!selectedMenuId.value) return;
  const res = await getCards(selectedMenuId.value, selectedSubMenuId.value || null);
  cards.value = res.data;
}

async function addCard() {
  if (!newCardTitle.value || !newCardUrl.value) return;
  await apiAddCard({ 
    menu_id: selectedMenuId.value, 
    sub_menu_id: selectedSubMenuId.value || null,
    title: newCardTitle.value, 
    url: newCardUrl.value, 
    logo_url: newCardLogo.value 
  });
  newCardTitle.value = '';
  newCardUrl.value = '';
  newCardLogo.value = '';
  loadCards();
}

async function updateCard(card) {
  await apiUpdateCard(card.id, {
    menu_id: selectedMenuId.value,
    sub_menu_id: selectedSubMenuId.value || null,
    title: card.title,
    url: card.url,
    logo_url: card.logo_url,
    desc: card.desc,
    order: card.order,
    tagIds: card.tags ? card.tags.map(t => t.id) : []
  });
  loadCards();
}

async function deleteCard(id) {
  await apiDeleteCard(id);
  loadCards();
}

function openTagSelector(card) {
  currentEditCard.value = card;
  selectedTagIds.value = card.tags ? card.tags.map(t => t.id) : [];
  showTagModal.value = true;
}

function closeTagSelector() {
  showTagModal.value = false;
  currentEditCard.value = null;
  selectedTagIds.value = [];
}

function toggleTag(tagId) {
  const index = selectedTagIds.value.indexOf(tagId);
  if (index > -1) {
    selectedTagIds.value.splice(index, 1);
  } else {
    selectedTagIds.value.push(tagId);
  }
}

async function saveCardTags() {
  if (!currentEditCard.value) return;
  
  await apiUpdateCard(currentEditCard.value.id, {
    menu_id: currentEditCard.value.menu_id,
    sub_menu_id: currentEditCard.value.sub_menu_id,
    title: currentEditCard.value.title,
    url: currentEditCard.value.url,
    logo_url: currentEditCard.value.logo_url,
    desc: currentEditCard.value.desc,
    order: currentEditCard.value.order,
    tagIds: selectedTagIds.value
  });
  
  closeTagSelector();
  loadCards();
}
</script>

<style scoped>
.card-manage {
  max-width: 1200px;
  width: 95%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  width: 95%;
  text-align: center;
}

.header-content {
  margin-bottom: 15px;
  text-align: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}



.card-add {
  margin: 0 auto;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.card-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  width: 100%;
}

.card-table {
  width: 100%;
  border-collapse: collapse;
  padding: 24px;
}

.card-table th,
.card-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.card-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

/* 表格列宽度设置 */
.card-table th:nth-child(1), /* 标题列 */
.card-table td:nth-child(1) {
  width: 10%;
}

.card-table th:nth-child(2), /* 网址列 */
.card-table td:nth-child(2) {
  width: 22%;
}

.card-table th:nth-child(3), /* Logo链接列 */
.card-table td:nth-child(3) {
  width: 22%;
}

.card-table th:nth-child(4), /* 描述列 */
.card-table td:nth-child(4) {
  width: 12%;
}

.card-table th:nth-child(5), /* 标签列 */
.card-table td:nth-child(5) {
  width: 15%;
}

.card-table th:nth-child(6), /* 排序列 */
.card-table td:nth-child(6) {
  width: 7%;
}

.card-table th:nth-child(7), /* 操作列 */
.card-table td:nth-child(7) {
  width: 12%;
  text-align: center;
}

.input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d0d7e2;
  background: #fff;
  color: #222;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

/* 窄输入框 - 主菜单、子菜单、卡片标题 */
.input.narrow {
  width: 140px;
}

/* 中等输入框 - 添加卡片按钮 */
.input.medium {
  width: 140px;
}

/* 宽输入框 - 卡片链接、logo链接 */
.input.wide {
  width: 200px;
}

/* 表格内输入框 */
.table-input {
  width: 100%;
  padding: 8px 4px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #222;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.table-input:focus {
  outline: none;
  border-color: #399dff;
  box-shadow: 0 0 0 2px rgba(57, 157, 255, 0.1);
}

.input:focus {
  outline: none;
  border-color: #399dff;
  box-shadow: 0 0 0 3px rgba(57, 157, 255, 0.1);
}

.order-input {
  width: 60px;
}

.btn {
  padding: 10px 8px;
  border: none;
  border-radius: 8px;
  background: #399dff;
  color: white;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  justify-content: center;
  border-radius: 6px;
}

.btn:hover {
  background: #2d7dd2;
  transform: translateY(-1px);
}

.btn-danger {
  background: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}

.tag-selector {
  cursor: pointer;
  padding: 6px 8px;
  border: 1px dashed #d0d7e2;
  border-radius: 6px;
  min-height: 32px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.tag-selector:hover {
  border-color: #667eea;
  background: #f9fafb;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mini-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  white-space: nowrap;
}

.tag-placeholder {
  font-size: 12px;
  color: #9ca3af;
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
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-tags {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.tag-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.tag-label {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: white;
  transition: opacity 0.2s;
}

.tag-option:hover .tag-label {
  opacity: 0.8;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

@media (max-width: 768px) {
  .card-manage {
    width: 94%;
    padding: 16px;
  }
  
  .card-card {
    padding: 16px 12px;
  }
  
  .card-add {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .input.narrow,
  .input.medium,
  .input.wide {
    width: 100%;
  }
  
  .order-input {
    width: 60px;
  }
  
  /* 移动端表格列宽度调整 */
  .card-table th:nth-child(1),
  .card-table td:nth-child(1),
  .card-table th:nth-child(2),
  .card-table td:nth-child(2),
  .card-table th:nth-child(3),
  .card-table td:nth-child(3),
  .card-table th:nth-child(4),
  .card-table td:nth-child(4),
  .card-table th:nth-child(5),
  .card-table td:nth-child(5),
  .card-table th:nth-child(6),
  .card-table td:nth-child(6),
  .card-table th:nth-child(7),
  .card-table td:nth-child(7) {
    width: auto;
  }
}
</style> 