<template>
  <div class="container card-grid" :class="[animationClass, { 'edit-mode': editMode }]">
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
  editMode: Boolean
});

const emit = defineEmits(['cardsReordered', 'editCard', 'deleteCard']);

let sortableInstance = null;

// 动画状态
const animationClass = ref('');
const animationType = ref('slideUp'); // 'slideUp' 或 'radial'

// 初始化拖拽功能
function initSortable() {
  if (!props.editMode || sortableInstance) return;
  
  const container = document.querySelector('.card-grid');
  if (!container) return;
  
  sortableInstance = new Sortable(container, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    handle: '.link-item',
    onEnd: (evt) => {
      // 拖拽结束后，通知父组件更新顺序
      const reorderedCards = Array.from(container.children).map((el, index) => {
        const cardId = parseInt(el.getAttribute('data-card-id'));
        return props.cards.find(c => c.id === cardId);
      }).filter(Boolean);
      
      emit('cardsReordered', reorderedCards);
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

// 监听 cards 变化，触发动画
watch(() => props.cards, (newCards, oldCards) => {
  // 如果是新的卡片数据或者从有数据变成其他数据
  if (newCards && newCards.length > 0) {
    // 如果是首次加载或者数据发生了变化
    const isDataChanged = !oldCards || oldCards.length === 0 || JSON.stringify(newCards) !== JSON.stringify(oldCards);
    if (isDataChanged) {
      // 延迟一下确保DOM更新完成
      nextTick(() => {
        triggerAnimation();
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

// 获取卡片样式（用于延迟动画）
function getCardStyle(index) {
  if (!animationClass.value) return {};
  
  // 在移动设备上不使用延迟动画
  const isMobile = window.innerWidth <= 480;
  if (isMobile) {
    return {
      animationDelay: '0s'
    };
  }
  
  if (animationType.value === 'slideUp') {
    // 从下往上：按索引顺序延迟
    return {
      animationDelay: `${index * 0.05}s`
    };
  } else if (animationType.value === 'radial') {
    // 从中心扩散：根据距离中心的位置计算延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    const col = index % cols;
    const centerCol = Math.floor(cols / 2);
    const distance = Math.abs(col - centerCol) + row;
    return {
      animationDelay: `${distance * 0.08}s`
    };
  } else if (animationType.value === 'fadeIn') {
    // 淡入动画：随机延迟
    return {
      animationDelay: `${Math.random() * 0.5}s`
    };
  } else if (animationType.value === 'slideLeft') {
    // 从左往右：按行延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    return {
      animationDelay: `${row * 0.1}s`
    };
  } else if (animationType.value === 'slideRight') {
    // 从右往左：按行延迟（反向）
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      animationDelay: `${(row + (cols - col - 1) * 0.02) * 0.08}s`
    };
  } else if (animationType.value === 'convergeIn') {
    // 从两边往中间靠拢：根据列的位置计算延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const col = index % cols;
    const centerCol = Math.floor(cols / 2);
    const distanceFromCenter = Math.abs(col - centerCol);
    // 边缘的元素先出现，中间的最后出现
    return {
      animationDelay: `${(cols - distanceFromCenter - 1) * 0.08}s`
    };
  } else if (animationType.value === 'flipIn') {
    // 翻转入场：按对角线延迟
    const cols = window.innerWidth <= 768 ? 3 : (window.innerWidth <= 1200 ? 4 : 6);
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      animationDelay: `${(row + col) * 0.06}s`
    };
  }
  
  return {};
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
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  padding: 0;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-height: 85px;
  height: 85px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.link-item:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}
.link-item a {
  /* margin-top: 8px; */
  text-decoration: none;
  color: #ffffff;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}
.link-icon {
  width: 25px;
  height: 25px;
  margin: 4px auto;
  object-fit: contain;
}
.link-text {
  padding-right: 4px;
  padding-left: 4px;
  font-size: 14px;
  text-align: center;
  word-break: break-all;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1;
  min-height: 1.5em;
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
  opacity: 0.4;
  background-color: rgba(255, 255, 255, 0.4);
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
  gap: 2px;
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
