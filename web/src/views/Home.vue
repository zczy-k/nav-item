<template>
  <div class="home-container">
    <div class="menu-bar-fixed">
      <MenuBar 
        :menus="menus" 
        :activeId="activeMenu?.id" 
        :activeSubMenuId="activeSubMenu?.id"
        @select="selectMenu"
      />
    </div>
    
    <div class="search-section">
      <div class="search-box-wrapper">
        <div class="search-engine-select">
          <button v-for="engine in searchEngines" :key="engine.name"
            :class="['engine-btn', {active: selectedEngine.name === engine.name}]"
            @click="selectEngine(engine)"
          >
            {{ engine.label }}
          </button>
        </div>
        <div class="search-container">
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="selectedEngine.placeholder" 
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch" aria-label="清空" title="clear">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
          <button @click="handleSearch" class="search-btn" title="search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 左侧广告条 -->
    <div v-if="leftAds.length" class="ad-space-fixed left-ad-fixed">
      <a v-for="ad in leftAds" :key="ad.id" :href="ad.url" target="_blank">
        <img :src="ad.img" alt="广告" loading="lazy" />
      </a>
    </div>
    <!-- 右侧广告条 -->
    <div v-if="rightAds.length" class="ad-space-fixed right-ad-fixed">
      <a v-for="ad in rightAds" :key="ad.id" :href="ad.url" target="_blank">
        <img :src="ad.img" alt="广告" loading="lazy" />
      </a>
    </div>
    
    <CardGrid :cards="filteredCards"/>
    
    <!-- 批量添加悬浮按钮 -->
    <button v-if="activeMenu" @click="openBatchAddModal" class="batch-add-btn" title="批量添加网站">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
    
    <!-- 切换背景按钮 -->
    <button @click="changeBackground" class="change-bg-btn" title="切换背景" :disabled="bgLoading">
      <svg v-if="!bgLoading" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <path d="M21 15l-5-5L5 21"></path>
      </svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    </button>
    
    <!-- 批量添加弹窗 -->
    <div v-if="showBatchAddModal" class="modal-overlay" @click="closeBatchAdd">
      <div class="modal-content batch-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ batchStep === 1 ? '验证密码' : batchStep === 2 ? '输入网址' : '预览并选择' }}</h3>
          <button @click="closeBatchAdd" class="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <!-- 步骤 1: 密码验证 -->
          <div v-if="batchStep === 1" class="batch-step">
            <p class="batch-tip">请输入管理员密码以继续：</p>
            <input 
              v-model="batchPassword" 
              type="password" 
              placeholder="请输入管理员密码"
              class="batch-input"
              @keyup.enter="verifyPassword"
            />
            <div class="remember-password-wrapper">
              <label>
                <input type="checkbox" v-model="rememberPassword" />
                <span>记住密码（2小时）</span>
              </label>
            </div>
            <p v-if="batchError" class="batch-error">{{ batchError }}</p>
            <div class="batch-actions">
              <button @click="closeBatchAdd" class="btn btn-cancel">取消</button>
              <button @click="verifyPassword" class="btn btn-primary" :disabled="batchLoading">
                {{ batchLoading ? '验证中...' : '确认' }}
              </button>
            </div>
          </div>
          
          <!-- 步骤 2: 输入网址 -->
          <div v-if="batchStep === 2" class="batch-step">
            <p class="batch-tip">请输入需要添加的网址，每行一个：</p>
            <textarea 
              v-model="batchUrls" 
              placeholder="例如：&#10;https://github.com&#10;https://google.com&#10;https://stackoverflow.com"
              class="batch-textarea"
              rows="10"
            ></textarea>
            <p v-if="batchError" class="batch-error">{{ batchError }}</p>
            <div class="batch-actions">
              <button @click="handleBackToPassword" class="btn btn-cancel">上一步</button>
              <button @click="parseUrls" class="btn btn-primary" :disabled="batchLoading || !batchUrls.trim()">
                {{ batchLoading ? '解析中...' : '下一步' }}
              </button>
            </div>
          </div>
          
          <!-- 步骤 3: 预览选择 -->
          <div v-if="batchStep === 3" class="batch-step">
            <p class="batch-tip">请选择需要添加的网站：</p>
            <div class="batch-preview-list">
              <div v-for="(item, index) in parsedCards" :key="index" class="batch-preview-item">
                <input type="checkbox" v-model="item.selected" :id="`card-${index}`" />
                <div class="batch-card-preview">
                  <img :src="item.logo" :alt="item.title" class="batch-card-logo" @error="e => e.target.src = '/default-favicon.png'" />
                  <div class="batch-card-info">
                    <div class="batch-edit-field">
                      <label>标题：</label>
                      <input type="text" v-model="item.title" class="batch-edit-input" />
                    </div>
                    <div class="batch-edit-field">
                      <label>Logo：</label>
                      <input type="text" v-model="item.logo" class="batch-edit-input" />
                    </div>
                    <div class="batch-edit-field">
                      <label>描述：</label>
                      <textarea v-model="item.description" class="batch-edit-textarea" rows="2"></textarea>
                    </div>
                    <p class="batch-card-url">{{ item.url }}</p>
                    <p v-if="!item.success" class="batch-card-warning">⚠️ {{ item.error }}</p>
                  </div>
                </div>
              </div>
            </div>
            <p v-if="batchError" class="batch-error">{{ batchError }}</p>
            <div class="batch-actions">
              <button @click="batchStep = 2" class="btn btn-cancel">上一步</button>
              <button @click="addSelectedCards" class="btn btn-primary" :disabled="batchLoading || selectedCardsCount === 0">
                {{ batchLoading ? '添加中...' : `添加 (${selectedCardsCount})` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <footer class="footer">
      <div class="footer-content">
        <button @click="showFriendLinks = true" class="friend-link-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          友情链接
        </button>
        <p class="copyright">Copyright © 2025 Nav-Item | <a href="https://github.com/zczy-k/nav-item" target="_blank" class="footer-link">Powered by zczy-k</a></p>
      </div>
    </footer>

    <!-- 友情链接弹窗 -->
    <div v-if="showFriendLinks" class="modal-overlay" @click="showFriendLinks = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>友情链接</h3>
          <button @click="showFriendLinks = false" class="close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="friend-links-grid">
            <a 
              v-for="friend in friendLinks" 
              :key="friend.id" 
              :href="friend.url" 
              target="_blank" 
              class="friend-link-card"
            >
              <div class="friend-link-logo">
                <img 
                  v-if="friend.logo" 
                  :src="friend.logo" 
                  :alt="friend.title"
                  loading="lazy"
                  @error="handleLogoError"
                />
                <div v-else class="friend-link-placeholder">
                  {{ friend.title.charAt(0) }}
                </div>
              </div>
              <div class="friend-link-info">
                <h4>{{ friend.title }}</h4>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount, computed, defineAsyncComponent } from 'vue';
import { getMenus, getCards, getAds, getFriends, login, batchParseUrls, batchAddCards, getRandomWallpaper } from '../api';
import MenuBar from '../components/MenuBar.vue';
const CardGrid = defineAsyncComponent(() => import('../components/CardGrid.vue'));

const menus = ref([]);
const activeMenu = ref(null);
const activeSubMenu = ref(null);
const cards = ref([]);
const searchQuery = ref('');
const leftAds = ref([]);
const rightAds = ref([]);
const showFriendLinks = ref(false);
const friendLinks = ref([]);

// 批量添加相关状态
const showBatchAddModal = ref(false);
const batchStep = ref(1); // 1:密码验证 2:输入网址 3:预览选择
const batchPassword = ref('');
const batchUrls = ref('');
const batchLoading = ref(false);
const batchError = ref('');
const parsedCards = ref([]);
const rememberPassword = ref(false);

// 背景切换相关
const bgLoading = ref(false);

const selectedCardsCount = computed(() => {
  return parsedCards.value.filter(card => card.selected).length;
});

// 聚合搜索配置
const searchEngines = [
  {
    name: 'google',
    label: 'Google',
    placeholder: 'Google 搜索...',
    url: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`
  },
  {
    name: 'baidu',
    label: '百度',
    placeholder: '百度搜索...',
    url: q => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`
  },
  {
    name: 'bing',
    label: 'Bing',
    placeholder: 'Bing 搜索...',
    url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`
  },
  {
    name: 'github',
    label: 'github',
    placeholder: 'GitHub 搜索...',
    url: q => `https://github.com/search?q=${encodeURIComponent(q)}&type=repositories`
  },
  {
    name: 'site',
    label: '站内',
    placeholder: '站内搜索...',
    url: q => `/search?query=${encodeURIComponent(q)}`
  }
];

// 从 localStorage 读取保存的默认搜索引擎
const getDefaultEngine = () => {
  try {
    const savedEngineName = localStorage.getItem('default_search_engine');
    if (savedEngineName) {
      const engine = searchEngines.find(e => e.name === savedEngineName);
      if (engine) return engine;
    }
  } catch (e) {
    console.error('Failed to load default search engine:', e);
  }
  return searchEngines[0]; // 默认返回 Google
};

const selectedEngine = ref(getDefaultEngine());

function selectEngine(engine) {
  selectedEngine.value = engine;
  // 保存到 localStorage
  try {
    localStorage.setItem('default_search_engine', engine.name);
  } catch (e) {
    console.error('Failed to save default search engine:', e);
  }
}

function clearSearch() {
  searchQuery.value = '';
}

const filteredCards = computed(() => {
  if (!searchQuery.value) return cards.value;
  return cards.value.filter(card => 
    card.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    card.url.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 在组件渲染前应用保存的背景，避免闪烁
onBeforeMount(() => {
  const savedBg = localStorage.getItem('nav_background');
  if (savedBg) {
    // 在 nextTick 中应用，确保 DOM 元素存在
    document.addEventListener('DOMContentLoaded', () => {
      const homeContainer = document.querySelector('.home-container');
      if (homeContainer) {
        homeContainer.style.backgroundImage = `url(${savedBg})`;
        homeContainer.style.backgroundSize = 'cover';
        homeContainer.style.backgroundPosition = 'center';
        homeContainer.style.backgroundRepeat = 'no-repeat';
        homeContainer.style.backgroundAttachment = 'fixed';
      }
    });
  }
});

onMounted(async () => {
  const res = await getMenus();
  menus.value = res.data;
  if (menus.value.length) {
    activeMenu.value = menus.value[0];
    loadCards();
  }
  // 加载广告
  const adRes = await getAds();
  leftAds.value = adRes.data.filter(ad => ad.position === 'left');
  rightAds.value = adRes.data.filter(ad => ad.position === 'right');
  
  const friendRes = await getFriends();
  friendLinks.value = friendRes.data;
  
  // 再次检查并应用背景（防止 onBeforeMount 没有执行）
  const savedBg = localStorage.getItem('nav_background');
  if (savedBg) {
    const homeContainer = document.querySelector('.home-container');
    if (homeContainer && !homeContainer.style.backgroundImage.includes(savedBg)) {
      homeContainer.style.backgroundImage = `url(${savedBg})`;
      homeContainer.style.backgroundSize = 'cover';
      homeContainer.style.backgroundPosition = 'center';
      homeContainer.style.backgroundRepeat = 'no-repeat';
      homeContainer.style.backgroundAttachment = 'fixed';
    }
  }
  
  // 检查是否有保存的密码token
  checkSavedPassword();
});

async function selectMenu(menu, parentMenu = null) {
  if (parentMenu) {
    // 选择的是子菜单
    activeMenu.value = parentMenu;
    activeSubMenu.value = menu;
  } else {
    // 选择的是主菜单
    activeMenu.value = menu;
    activeSubMenu.value = null;
  }
  loadCards();
}

async function loadCards() {
  if (!activeMenu.value) return;
  const res = await getCards(activeMenu.value.id, activeSubMenu.value?.id);
  cards.value = res.data;
}

async function handleSearch() {
  if (!searchQuery.value.trim()) return;
  if (selectedEngine.value.name === 'site') {
    // 站内搜索：遍历所有菜单，查找所有卡片
    let found = false;
    for (const menu of menus.value) {
      const res = await getCards(menu.id);
      const match = res.data.find(card =>
        card.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        card.url.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
      if (match) {
        activeMenu.value = menu;
        cards.value = res.data;
        setTimeout(() => {
          const el = document.querySelector(`[data-card-id='${match.id}']`);
          if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 100);
        found = true;
        break;
      }
    }
    if (!found) {
      alert('未找到相关内容');
    }
  } else {
    const url = selectedEngine.value.url(searchQuery.value);
    window.open(url, '_blank');
  }
}

function handleLogoError(event) {
  event.target.style.display = 'none';
  event.target.nextElementSibling.style.display = 'flex';
}

// 批量添加相关函数
// 打开批量添加弹窗，检查是否有有效的token
async function openBatchAddModal() {
  showBatchAddModal.value = true;
  batchError.value = '';
  
  // 检查是否有保存的密码token
  const savedData = localStorage.getItem('nav_password_token');
  if (savedData) {
    try {
      const { password, expiry, token } = JSON.parse(savedData);
      if (Date.now() < expiry && token) {
        // token未过期，恢复token并直接跳到第二步
        localStorage.setItem('token', token);
        batchPassword.value = password;
        rememberPassword.value = true;
        batchStep.value = 2;
        return;
      } else {
        // 已过期，清除
        localStorage.removeItem('nav_password_token');
      }
    } catch (e) {
      localStorage.removeItem('nav_password_token');
    }
  }
  
  // 没有有效token，显示密码验证步骤
  batchStep.value = 1;
}

function closeBatchAdd() {
  showBatchAddModal.value = false;
  batchStep.value = 1;
  batchPassword.value = '';
  batchUrls.value = '';
  batchError.value = '';
  parsedCards.value = [];
  batchLoading.value = false;
}

// 检查保存的密码
function checkSavedPassword() {
  const savedData = localStorage.getItem('nav_password_token');
  if (savedData) {
    try {
      const { password, expiry, token } = JSON.parse(savedData);
      if (Date.now() < expiry) {
        // 密码未过期，自动填充并恢复token
        batchPassword.value = password;
        rememberPassword.value = true;
        // 如果有保存的token，也恢复它
        if (token) {
          localStorage.setItem('token', token);
        }
      } else {
        // 已过期，清除
        localStorage.removeItem('nav_password_token');
      }
    } catch (e) {
      localStorage.removeItem('nav_password_token');
    }
  }
}

async function verifyPassword() {
  if (!batchPassword.value) {
    batchError.value = '请输入密码';
    return;
  }
  
  batchLoading.value = true;
  batchError.value = '';
  
  try {
    // 使用默认管理员用户名 admin 进行验证，并获取响应
    const response = await login('admin', batchPassword.value);
    
    // 检查并保存 token
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    } else {
      // 如果没有 token 返回，说明登录逻辑有问题
      throw new Error('登录成功，但未收到 token');
    }
    
    // 如果选择了记住密码，保存到2小时
    if (rememberPassword.value) {
      const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2小时
      localStorage.setItem('nav_password_token', JSON.stringify({
        password: batchPassword.value,
        token: response.data.token,
        expiry
      }));
    } else {
      localStorage.removeItem('nav_password_token');
    }
    
    batchStep.value = 2;
  } catch (error) {
    batchError.value = '密码错误，请重试';
    console.error('密码验证失败:', error);
  } finally {
    batchLoading.value = false;
  }
}

// 返回密码验证步骤（清除保存的token）
function handleBackToPassword() {
  // 清除保存的token，要求重新验证
  localStorage.removeItem('nav_password_token');
  localStorage.removeItem('token');
  batchPassword.value = '';
  rememberPassword.value = false;
  batchStep.value = 1;
}

async function parseUrls() {
  const urls = batchUrls.value
    .split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
  
  if (urls.length === 0) {
    batchError.value = '请输入至少一个网址';
    return;
  }
  
  batchLoading.value = true;
  batchError.value = '';
  
  try {
    const response = await batchParseUrls(urls);
    parsedCards.value = response.data.data.map(card => ({
      ...card,
      selected: true // 默认全选
    }));
    batchStep.value = 3;
  } catch (error) {
    batchError.value = error.response?.data?.error || '解析失败，请重试';
  } finally {
    batchLoading.value = false;
  }
}

async function addSelectedCards() {
  const selected = parsedCards.value.filter(card => card.selected);
  
  if (selected.length === 0) {
    batchError.value = '请至少选择一个网站';
    return;
  }
  
  batchLoading.value = true;
  batchError.value = '';
  
  try {
    const cardsToAdd = selected.map(card => ({
      title: card.title,
      url: card.url,
      logo: card.logo,
      description: card.description
    }));
    
    await batchAddCards(
      activeMenu.value.id,
      activeSubMenu.value?.id || null,
      cardsToAdd
    );
    
    // 添加成功，关闭弹窗并刷新卡片列表
    alert(`成功添加 ${selected.length} 个网站！`);
    closeBatchAdd();
    await loadCards();
  } catch (error) {
    batchError.value = error.response?.data?.error || '添加失败，请重试';
  } finally {
    batchLoading.value = false;
  }
}

// 切换背景壁纸
async function changeBackground() {
  if (bgLoading.value) return;
  
  bgLoading.value = true;
  
  try {
    const response = await getRandomWallpaper();
    const wallpaperUrl = response.data.url;
    
    // 更新背景 - 直接更新或创建 <style> 标签，使用 !important 覆盖
    let bgStyle = document.getElementById('dynamic-bg-style');
    if (!bgStyle) {
      bgStyle = document.createElement('style');
      bgStyle.id = 'dynamic-bg-style';
      document.head.appendChild(bgStyle);
    }
    bgStyle.textContent = `.home-container { background-image: url(${wallpaperUrl}) !important; }`;
    
    // 保存到localStorage，下次刷新时自动应用
    localStorage.setItem('nav_background', wallpaperUrl);
  } catch (error) {
    console.error('获取壁纸失败:', error);
    alert('获取壁纸失败，请稍后重试');
  } finally {
    bgLoading.value = false;
  }
}
</script>

<style scoped>
.menu-bar-fixed {
  position: fixed;
  top: .6rem;
  left: 0;
  width: 100vw;
  z-index: 100;
  /* background: rgba(0,0,0,0.6); /* 可根据需要调整 */
  /* backdrop-filter: blur(8px);  /*  毛玻璃效果 */
}

.search-engine-select {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-bottom: .3rem;
  gap: 5px;
  z-index: 2;
}
.engine-btn {
  border: none;
  background: none;
  color: #ffffff;
  font-size: .8rem ;
  padding: 2px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}
.engine-btn.active, .engine-btn:hover {
  color: #399dff;
  background: #ffffff1a;
}

.search-container {
  display: flex;
  align-items: center;
  background: #b3b7b83b;
  border-radius: 20px;
  padding: 0.3rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 640px;
  width: 92%;
  position: relative;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: .1rem .5rem;
  font-size: 1.2rem;
  color: #ffffff;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.clear-btn {
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  margin-right: 0.2rem;
  display: flex;
  align-items: center;
  padding: 0;
}

.search-btn {
  background: #e9e9eb00;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  margin-right: 0.1rem;
}

.search-btn:hover {
  background: #3367d6;
}

.home-container {
  min-height: 95vh;
  background-image: url('https://main.ssss.nyc.mn/background.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  /* padding: 1rem 1rem; */
  position: relative;
  padding-top: 50px; 
}

.home-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.search-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.8rem 0;
  position: relative;
  z-index: 2;
}

.search-box-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 640px;
}

.content-wrapper {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  gap: 2rem;
  position: relative;
  z-index: 2;
  flex: 1;
  justify-content: space-between;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.ad-space {
  width: 90px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 0;
  background: transparent;
  margin: 0;
}
.ad-space a {
  width: 100%;
  display: block;
}
.ad-space img {
  width: 100%;
  max-width: 90px;
  max-height: 160px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  background: #fff;
  object-fit: contain;
  margin: 0 auto;
}

.ad-placeholder {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  padding: 2rem 1rem;
  text-align: center;
  font-size: 14px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer {
  margin-top: auto;
  text-align: center;
  padding-top: 1rem;
  padding-bottom: 2rem;
  position: relative;
  z-index: 2;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
}

.friend-link-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  padding: 0;
}

.friend-link-btn:hover {
  color: #1976d2;
  transform: translateY(-1px);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #8585859c;
  border-radius: 16px;
  width: 55rem;
  height: 30rem;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #d3d6d8;
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #cf1313;
}

.modal-body {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.friend-links-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
@media (max-width: 768px) {
  .friend-links-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .container {
    width: 95%;
  }
}

.friend-link-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  background: #cfd3d661;
  border-radius: 15px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  border: 1px solid #cfd3d661;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.friend-link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  background: #ffffff8e;
}

.friend-link-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.friend-link-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.friend-link-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
}

.friend-link-info h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
}

.copyright {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.footer-link {
  color: #ffffffcc;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-link:hover {
  color: #1976d2;
}

:deep(.menu-bar) {
  position: relative;
  z-index: 2;
}

:deep(.card-grid) {
  position: relative;
  z-index: 2;
}

.ad-space-fixed {
  position: fixed;
  top: 13rem;
  z-index: 10;
  width: 90px;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0;
  background: transparent;
  margin: 0;
}
.left-ad-fixed {
  left: 0;
}
.right-ad-fixed {
  right: 0;
}
.ad-space-fixed a {
  width: 100%;
  display: block;
}
.ad-space-fixed img {
  width: 100%;
  max-width: 90px;
  max-height: 160px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  background: #fff;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
    gap: 1rem;
  }
  
  .ad-space {
    width: 100%;
    height: 100px;
  }
  
  .ad-placeholder {
    height: 80px;
  }
}

@media (max-width: 768px) {
  .home-container {
    padding-top: 80px;
  }
  
  .content-wrapper {
    gap: 0.5rem;
  }
  
  .ad-space {
    height: 60px;
  }
  
  .ad-placeholder {
    height: 50px;
    font-size: 12px;
    padding: 1rem 0.5rem;
  }
  .footer {
    padding-top: 2rem;
  }
  .friend-link-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.7rem;
    padding: 0;
  }
  .copyright {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.7rem;
    margin: 0;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  .footer-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }
}

/* 批量添加按钮 */
.batch-add-btn {
  position: fixed;
  right: -45px;
  bottom: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85));
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 2px 15px rgba(102, 126, 234, 0.3);
  transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, opacity 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  backdrop-filter: blur(5px);
}

.batch-add-btn:hover {
  right: 16px;
  opacity: 1;
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
}

/* 切换背景按钮 */
.change-bg-btn {
  position: fixed;
  right: -45px;
  bottom: 100px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(52, 168, 83, 0.85), rgba(15, 157, 88, 0.85));
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 2px 15px rgba(52, 168, 83, 0.3);
  transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, opacity 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  backdrop-filter: blur(5px);
}

.change-bg-btn:hover:not(:disabled) {
  right: 16px;
  opacity: 1;
  box-shadow: 0 6px 30px rgba(52, 168, 83, 0.5);
}

.change-bg-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.change-bg-btn:disabled svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 批量添加弹窗 */
.batch-modal {
  width: 700px;
  max-height: 80vh;
}

.batch-step {
  min-height: 300px;
}

.batch-tip {
  font-size: 16px;
  color: #374151;
  margin-bottom: 16px;
}

.batch-input,
.batch-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.batch-textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
}

.batch-input:focus,
.batch-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.batch-error {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 16px;
}

.batch-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 预览列表 */
.batch-preview-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.batch-preview-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.batch-preview-item input[type="checkbox"] {
  margin-top: 8px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.batch-card-preview {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.batch-card-preview:hover {
  background: #f3f4f6;
  border-color: #667eea;
}

.batch-card-logo {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: contain;
  background: white;
  padding: 4px;
  border: 1px solid #e5e7eb;
}

.batch-card-info {
  flex: 1;
  min-width: 0;
}

.batch-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  word-break: break-word;
}

.batch-card-url {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 6px 0;
  word-break: break-all;
}

.batch-card-desc {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

.batch-card-warning {
  font-size: 12px;
  color: #dc2626;
  margin: 4px 0 0 0;
}

/* 可编辑字段样式 */
.batch-edit-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.batch-edit-field label {
  font-size: 13px;
  color: #6b7280;
  min-width: 50px;
  font-weight: 500;
}

.batch-edit-input,
.batch-edit-textarea {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  transition: all 0.2s;
}

.batch-edit-input:focus,
.batch-edit-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.batch-edit-textarea {
  resize: vertical;
  min-height: 40px;
  font-family: inherit;
  line-height: 1.4;
}

/* 记住密码复选框 */
.remember-password-wrapper {
  margin-bottom: 16px;
}

.remember-password-wrapper label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.remember-password-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .batch-modal {
    width: 95vw;
  }
  
  .batch-add-btn {
    right: -40px;
    bottom: 20px;
    width: 48px;
    height: 48px;
  }
  
  .batch-add-btn:hover {
    right: 12px;
  }
  
  .change-bg-btn {
    right: -40px;
    bottom: 80px;
    width: 48px;
    height: 48px;
  }
  
  .change-bg-btn:hover:not(:disabled) {
    right: 12px;
  }
  
  .batch-card-preview {
    flex-direction: column;
  }
}
</style> 