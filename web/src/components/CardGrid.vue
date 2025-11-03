<template>
  <div ref="cardGridRef" class="container card-grid" :class="[animationClass, { 'edit-mode': editMode }]">
    <div v-for="(card, index) in cards" :key="card.id"
         class="link-item" 
         :class="{ 'draggable': editMode }"
         :data-card-id="card.id"
         :style="getCardStyle(index)">
      <a :href="editMode ? 'javascript:void(0)' : card.url" :target="editMode ? '' : '_blank'" :title="getTooltip(card)" @click="editMode ? $event.preventDefault() : null">
        <img class="link-icon" :src="getLogo(card)" alt="" @error="onImgError($event, card)" loading="lazy">
        <span class="link-text">{{ truncate(card.title) }}</span>
      </a>
      <div v-if="editMode" class="card-btns">
        <input 
          type="checkbox" 
          class="card-checkbox"
          :checked="isCardSelected(card)"
          @click.stop="$emit('toggleCardSelection', card)"
          title="选中"
        />
        <button @click.stop="$emit('editCard', card)" class="card-btn edit-btn" title="编辑">✏️</button>
        <button @click.stop="$emit('deleteCard', card)" class="card-btn del-btn" title="删除">🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import Sortable from 'sortablejs';

const props = defineProps({ 
  cards: Array,
  editMode: Boolean,
  selectedCards: Array,
  categoryId: Number,
  subCategoryId: [Number, null]
});

const emit = defineEmits(['cardsReordered', 'editCard', 'deleteCard', 'toggleCardSelection']);

// 容器引用
const cardGridRef = ref(null);
let sortableInstance = null;

// 动画状态
const animationClass = ref('');
const animationType = ref('slideUp'); // 'slideUp' 或 'radial'

// 初始化拖拽功能
function initSortable() {
  if (!props.editMode || sortableInstance) return;
  
  // 使用组件自己的 ref，而不是全局选择器
  const container = cardGridRef.value;
  if (!container) return;
  
  sortableInstance = new Sortable(container, {
    animation: 150,
    group: 'cards', // 设置组名，允许跨分类拖动
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.link-item',
    onEnd: (evt) => {
      // 拖拽结束后，通知父组件更新顺序
      const targetContainer = evt.to;
      // 只需要传递卡片ID列表，父组件会处理完整数据
      const cardIds = Array.from(targetContainer.children).map((el) => {
        return parseInt(el.getAttribute('data-card-id'));
      }).filter(id => !isNaN(id));
      
      // 传递卡片ID列表和目标分类ID
      emit('cardsReordered', cardIds, props.categoryId, props.subCategoryId);
    }
  });
}

// 销毁拖拽功能
function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

// 监听编辑模式变化
watch(() => props.editMode, (newVal) => {
  if (newVal) {
    nextTick(() => initSortable());
  } else {
    destroySortable();
  }
});

onMounted(() => {
  if (props.editMode) {
    nextTick(() => initSortable());
  }
});

onUnmounted(() => {
  destroySortable();
});

// 监听 cards 变化，触发动画并重新初始化 Sortable
watch(() => props.cards, (newCards, oldCards) => {
  // 如果是新的卡片数据或者从有数据变成其他数据
  if (newCards && newCards.length > 0) {
    // 如果是首次加载或者数据发生了变化
    const isDataChanged = !oldCards || oldCards.length === 0 || JSON.stringify(newCards) !== JSON.stringify(oldCards);
    if (isDataChanged) {
      // 延迟一下确保DOM更新完成
      nextTick(() => {
        triggerAnimation();
        // 在编辑模式下，重新初始化 Sortable（因为 DOM 可能已重新渲染）
        if (props.editMode) {
          destroySortable();
          nextTick(() => initSortable());
        }
      });
    }
  }
}, { deep: true, immediate: false });

// 触发动画
function triggerAnimation() {
  // 随机选择动画类型，替换bounceIn为convergeIn
  const animations = ['slideUp', 'radial', 'fadeIn', 'slideLeft', 'slideRight', 'convergeIn', 'flipIn'];
  const randomIndex = Math.floor(Math.random() * animations.length);
  animationType.value = animations[randomIndex];
  animationClass.value = `animate-${animationType.value}`;
  
  // 动画结束后清除类名
  setTimeout(() => {
    animationClass.value = '';
  }, 1200);
}

// 获取卡片样式（用于延迟动画 + 随机渐变色）
function getCardStyle(index) {
  const gradient = gradients[index % gradients.length];
  const style = {
    background: gradient
  };
  
  if (!animationClass.value) return style;
  
  // 在移动设备上不使用延迟动画
  const isMobile = window.innerWidth <= 480;
  if (isMobile) {
    style.animationDelay = '0s';
    return style;
  }
  
  if (animationType.value === 'slideUp') {
    // 从下往上：按索引顺序延迟
    style.animationDelay = `${index * 0.05}s`;
  } else if (animationType.value === 'radial') {
    // 从中心扩散：根据距离中心的位置计算延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    const col = index % cols;
    const centerCol = Math.floor(cols / 2);
    const distance = Math.abs(col - centerCol) + row;
    style.animationDelay = `${distance * 0.08}s`;
  } else if (animationType.value === 'fadeIn') {
    // 淡入动画：随机延迟
    style.animationDelay = `${Math.random() * 0.5}s`;
  } else if (animationType.value === 'slideLeft') {
    // 从左往右：按行延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    style.animationDelay = `${row * 0.1}s`;
  } else if (animationType.value === 'slideRight') {
    // 从右往左：按行延迟（反向）
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    const col = index % cols;
    style.animationDelay = `${(row + (cols - col - 1) * 0.02) * 0.08}s`;
  } else if (animationType.value === 'convergeIn') {
    // 从两边往中间靠拢：根据列的位置计算延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const col = index % cols;
    const centerCol = Math.floor(cols / 2);
    const distanceFromCenter = Math.abs(col - centerCol);
    // 边缘的元素先出现，中间的最后出现
    style.animationDelay = `${(cols - distanceFromCenter - 1) * 0.08}s`;
  } else if (animationType.value === 'flipIn') {
    // 翻转入场：按对角线延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    const col = index % cols;
    style.animationDelay = `${(row + col) * 0.06}s`;
  }
  
  return style;
}

function getLogo(card) {
  if (card.custom_logo_path) return 'http://localhost:3000/uploads/' + card.custom_logo_path;
  if (card.logo_url) return card.logo_url;
  // 默认 favicon
  try {
    const url = new URL(card.url);
    return url.origin + '/favicon.ico';
  } catch {
    return '/default-favicon.png';
  }
}

function onImgError(e, card) {
  e.target.src = '/default-favicon.png';
}

function getTooltip(card) {
  let tip = '';
  if (card.desc) tip += card.desc + '\n';
  tip += card.url;
  return tip;
}

function truncate(str) {
  if (!str) return '';
  return str.length > 20 ? str.slice(0, 20) + '...' : str;
}

// 检查卡片是否被选中
function isCardSelected(card) {
  return props.selectedCards?.some(c => c.id === card.id) || false;
}

// 随机渐变色配置
const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f8b195 0%, #f67280 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
  'linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)',
  'linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)',
  'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)',
  'linear-gradient(135deg, #fda085 0%, #f6d365 100%)'
];
</script>

<style scoped>
.container {
  max-width: 55rem;
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 15px;
  opacity: 1;
  transition: opacity 0.2s ease;
}
@media (max-width: 1200px) {
  .container {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 768px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 480px) {
  .container {
    grid-template-columns: repeat(3, 1fr);
  }
}
.link-item {
  /* background 由 JS 动态设置 */
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border-radius: 16px;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  text-align: center;
  min-height: 85px;
  height: 85px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

/* 苹果风格光晕效果 */
.link-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.link-item:hover::before {
  left: 100%;
}

.link-item:hover {
  filter: brightness(1.08);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.5);
}

.link-item:active {
  transform: translateY(-2px) scale(0.98);
  transition: all 0.1s;
}
.link-item a {
  /* margin-top: 8px; */
  text-decoration: none;
  color: #ffffff;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
.link-icon {
  width: 28px;
  height: 28px;
  margin: 4px auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.link-item:hover .link-icon {
  transform: scale(1.15);
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
}
.link-text {
  padding-right: 4px;
  padding-left: 4px;
  font-size: 13px;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.2;
  min-height: 1.5em;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1d1d1f;
}

/* 动画样式 */
/* 从下往上滑入动画 */
.animate-slideUp .link-item {
  animation: slideUpIn 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes slideUpIn {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 从中心扩散动画 */
.animate-radial .link-item {
  animation: radialIn 0.5s ease-out forwards;
  opacity: 0;
  transform: scale(0.3);
}

@keyframes radialIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 淡入动画 */
.animate-fadeIn .link-item {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 从左滑入动画 */
.animate-slideLeft .link-item {
  animation: slideLeftIn 0.6s ease-out forwards;
  opacity: 0;
  transform: translateX(-50px);
}

@keyframes slideLeftIn {
  0% {
    opacity: 0;
    transform: translateX(-50px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 从右滑入动画 */
.animate-slideRight .link-item {
  animation: slideRightIn 0.6s ease-out forwards;
  opacity: 0;
  transform: translateX(50px);
}

@keyframes slideRightIn {
  0% {
    opacity: 0;
    transform: translateX(50px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 从两边往中间靠拢动画 */
.animate-convergeIn .link-item {
  animation: convergeIn 0.7s ease-out forwards;
  opacity: 0;
}

.animate-convergeIn .link-item:nth-child(6n+1),
.animate-convergeIn .link-item:nth-child(6n+6) {
  /* 最边缘的列（第1列和第6列） */
  transform: translateX(-80px);
}

.animate-convergeIn .link-item:nth-child(6n+2),
.animate-convergeIn .link-item:nth-child(6n+5) {
  /* 次边缘的列（第2列和第5列） */
  transform: translateX(-40px);
}

.animate-convergeIn .link-item:nth-child(6n+3),
.animate-convergeIn .link-item:nth-child(6n+4) {
  /* 中间的列（第3列和第4列） */
  transform: translateY(-30px);
}

/* 在中等屏幕上（4列布局） */
@media (max-width: 1200px) and (min-width: 769px) {
  .animate-convergeIn .link-item:nth-child(4n+1),
  .animate-convergeIn .link-item:nth-child(4n+4) {
    transform: translateX(-60px);
  }
  
  .animate-convergeIn .link-item:nth-child(4n+2),
  .animate-convergeIn .link-item:nth-child(4n+3) {
    transform: translateY(-30px);
  }
}

/* 在小屏幕上（3列布局） */
@media (max-width: 768px) {
  .animate-convergeIn .link-item:nth-child(3n+1),
  .animate-convergeIn .link-item:nth-child(3n+3) {
    transform: translateX(-50px);
  }
  
  .animate-convergeIn .link-item:nth-child(3n+2) {
    transform: translateY(-30px);
  }
}

@keyframes convergeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
    transform: translate(0, 0);
  }
}

/* 翻转入场动画 */
.animate-flipIn .link-item {
  animation: flipIn 0.7s ease-out forwards;
  opacity: 0;
  transform: rotateY(-90deg);
}

@keyframes flipIn {
  0% {
    opacity: 0;
    transform: rotateY(-90deg);
  }
  50% {
    opacity: 1;
    transform: rotateY(-45deg);
  }
  100% {
    opacity: 1;
    transform: rotateY(0deg);
  }
}

/* 优化过渡效果 */
.container:not(.animate-slideUp):not(.animate-radial):not(.animate-fadeIn) .link-item {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 响应式动画调整 */
@media (max-width: 768px) {
  .animate-slideUp .link-item {
    animation-duration: 0.4s;
  }
  
  .animate-radial .link-item {
    animation-duration: 0.4s;
  }
}

/* 减少动画延迟在移动设备上 */
@media (max-width: 480px) {
  .animate-slideUp .link-item {
    animation-delay: 0s !important;
  }
  
  .animate-radial .link-item {
    animation-delay: 0s !important;
  }
}

/* 为移动设备提供更快的动画 */
@media (prefers-reduced-motion: reduce) {
  .animate-slideUp .link-item,
  .animate-radial .link-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

/* 拖拽相关样式 */
.edit-mode .link-item.draggable {
  cursor: move;
  cursor: grab;
}

.edit-mode .link-item.draggable:active {
  cursor: grabbing;
}

.sortable-ghost {
  opacity: 0.5;
  background-color: rgba(255, 255, 255, 0.5);
}

.sortable-chosen {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(2deg);
}

/* 编辑模式下的视觉提示 */
.edit-mode .link-item {
  border: 2px dashed transparent;
  transition: all 0.2s;
  position: relative;
}

.edit-mode .link-item:hover {
  border-color: rgba(59, 130, 246, 0.5);
}

.card-btns {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.card-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
}

.card-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-btn:hover {
  transform: scale(1.1);
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.9);
}

.del-btn:hover {
  background: rgba(239, 68, 68, 0.9);
}
</style>
