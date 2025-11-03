# 首页布局详细分析

## 整体结构

首页(Home.vue)采用**垂直流式布局**,主要由以下几个层级组成:

```
.home-container (最外层容器)
├── .menu-bar-fixed (顶部导航栏 - 固定定位)
├── .search-section (搜索区域)
│   └── .search-box-wrapper
│       └── .search-container (搜索框)
│           ├── .search-engine-dropdown (搜索引擎选择器)
│           ├── input.search-input (搜索输入框)
│           ├── button.clear-btn (清除按钮)
│           └── button.search-btn (搜索按钮)
├── .ad-space-fixed.left-ad-fixed (左侧广告 - 固定定位)
├── .ad-space-fixed.right-ad-fixed (右侧广告 - 固定定位)
├── .move-target-panel (编辑模式分类选择面板 - 条件显示)
├── CardGrid组件 (卡片网格)
├── .fab-container (右下角浮动按钮组 - 固定定位)
│   ├── .change-bg-btn (切换背景)
│   ├── .batch-add-btn (批量添加)
│   ├── .exit-edit-btn / .edit-mode-btn (编辑模式切换)
│   └── .fab-toggle-btn (主切换按钮)
└── footer.footer (页脚)
    └── .footer-content
        ├── .friend-link-btn (友情链接按钮)
        └── p.copyright (版权信息)
```

---

## 详细布局说明

### 1. 最外层容器 `.home-container`

**定位方式**: `relative`  
**布局**: `flex`, `flex-direction: column`  
**特点**:
- 最小高度: `95vh`
- 背景图片: 固定附着 (`background-attachment: fixed`)
- 上边距: `padding-top: 50px` (为固定菜单栏留出空间)
- z-index 层叠: 使用伪元素 `::before` 添加半透明黑色遮罩层 (z-index: 1)

**背景遮罩**:
```css
.home-container::before {
  position: absolute;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}
```

---

### 2. 顶部导航栏 `.menu-bar-fixed`

**定位方式**: `fixed`  
**位置**: 
- `top: 0.6rem`
- `left: 0`
- `width: 100vw`
- `z-index: 100`

**特点**:
- 固定在页面顶部,滚动时不移动
- 包含 `MenuBar` 组件,显示主菜单和子菜单
- 始终可见,方便快速切换分类

---

### 3. 搜索区域 `.search-section`

**定位方式**: `relative`  
**布局**: `flex`, 垂直居中  
**位置**: 
- `z-index: 2` (在背景遮罩之上)
- `padding: 2.8rem 0` (上下边距)

#### 3.1 搜索容器 `.search-container`

**布局**: `flex`, 水平排列  
**样式**:
- 背景: 半透明白色 `rgba(255, 255, 255, 0.95)` + 毛玻璃效果
- 圆角: `border-radius: 25px`
- 最大宽度: `640px`
- 阴影: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15)`
- z-index: `10`

#### 3.2 搜索引擎下拉选择器 `.search-engine-dropdown`

**定位方式**: `relative`  
**位置**: 搜索框左侧,`margin-right: 8px`

**下拉菜单** `.engine-dropdown-menu`:
- 定位: `absolute`
- 位置: `top: calc(100% + 8px)`, `left: 0`
- z-index: `10001` (最高层级,确保不被其他元素遮挡)
- 背景: 半透明白色 + 毛玻璃效果
- 最小宽度: `200px`

#### 3.3 搜索输入框 `.search-input`

**布局**: `flex: 1` (占据剩余空间)  
**样式**:
- 背景透明
- 字体大小: `1.1rem`
- 无边框,无轮廓

#### 3.4 清除按钮 `.clear-btn`

**条件显示**: 仅当 `searchQuery` 有值时显示  
**位置**: 输入框右侧,搜索按钮左侧

#### 3.5 搜索按钮 `.search-btn`

**样式**:
- 圆形按钮: `width: 40px`, `height: 40px`
- 渐变背景: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 圆角: `border-radius: 50%`

---

### 4. 左右侧广告 `.ad-space-fixed`

**定位方式**: `fixed`  
**位置**:
- **左侧**: `left: 0`
- **右侧**: `right: 0`
- **垂直**: `top: 13rem` (在搜索框下方)
- z-index: `10`

**布局**: `flex`, `flex-direction: column`  
**尺寸**:
- 宽度: `90px`
- 图片最大高度: `160px`
- 间距: `gap: 5px`

**特点**:
- 固定定位,滚动时不移动
- 显示在页面两侧
- 条件渲染: 仅当有广告数据时显示

---

### 5. 编辑模式分类选择面板 `.move-target-panel`

**条件显示**: `v-if="editMode && showMovePanel"`  
**功能**: 在编辑模式下拖动卡片时,显示目标分类选择面板  
**内容**:
- 显示所有主菜单和子菜单
- 可点击选择目标分类
- 显示当前选中卡片数量

---

### 6. 卡片网格 `CardGrid` 组件

**定位方式**: `relative`  
**z-index**: `2` (在背景遮罩之上)

**特点**:
- 异步加载组件 (`defineAsyncComponent`)
- 接收卡片数据、编辑模式状态等props
- 触发拖拽排序、编辑、删除等事件

---

### 7. 浮动操作按钮组 `.fab-container`

**定位方式**: `fixed`  
**位置**:
- `right: 30px`
- `bottom: 30px`
- z-index: `999`

**布局**: `flex`, `flex-direction: column-reverse` (按钮从下往上排列)

#### 按钮组成(从下到上):
1. **主切换按钮** `.fab-toggle-btn` (始终显示)
   - 尺寸: `40px × 40px`
   - 渐变背景: 紫色到粉色
   - 点击切换菜单展开/收起

2. **进入/退出编辑模式按钮** (根据 `editMode` 条件显示)
   - `.edit-mode-btn`: 非编辑模式时显示
   - `.exit-edit-btn`: 编辑模式时显示

3. **批量添加按钮** `.batch-add-btn`
   - 尺寸: `37px × 37px`
   - 渐变背景: 蓝色渐变
   - 条件: `v-if="activeMenu"` (有活动菜单时)

4. **切换背景按钮** `.change-bg-btn`
   - 尺寸: `37px × 37px`
   - 渐变背景: 绿色渐变
   - 加载时显示旋转动画

**动画效果**:
- 展开/收起时: `transform: translateY(30px) scale(0.9)` 过渡
- 主按钮旋转: `transform: rotate(90deg)`
- 悬停放大: `transform: scale(1.1)`

---

### 8. 页脚 `.footer`

**定位**: 文档流底部  
**布局**: `flex`, 水平居中  
**z-index**: `2`

**内容**:
- 友情链接按钮 (点击弹出友情链接弹窗)
- 版权信息和GitHub链接

---

## 弹窗 (Modal) 结构

### 1. 批量添加弹窗 `.batch-modal`

**触发**: 点击FAB批量添加按钮  
**尺寸**: `width: 700px`, `max-height: 80vh`  
**步骤**:
1. 密码验证
2. 输入网址(多行)
3. 预览并选择要添加的卡片

### 2. 编辑密码验证弹窗

**触发**: 点击进入编辑模式  
**内容**: 输入管理员密码,可选记住密码

### 3. 友情链接弹窗

**触发**: 点击页脚友情链接按钮  
**内容**: 网格布局显示友情链接

### 4. 卡片编辑弹窗

**触发**: 编辑模式下点击卡片编辑按钮  
**内容**: 表单编辑卡片标题、URL、Logo、描述

### 5. 添加搜索引擎弹窗

**触发**: 点击搜索引擎下拉菜单的"+"按钮  
**步骤**:
1. 输入搜索引擎URL
2. 编辑解析后的信息(名称、图标、搜索URL模板)

---

## Z-Index 层级管理

从低到高:
1. **背景遮罩**: `z-index: 1`
2. **主内容区域**: `z-index: 2` (搜索区、卡片、页脚)
3. **左右侧广告**: `z-index: 10`
4. **顶部菜单栏**: `z-index: 100`
5. **FAB按钮组**: `z-index: 999`
6. **弹窗遮罩**: `z-index: 1000`
7. **搜索引擎下拉菜单**: `z-index: 10001` (最高)

---

## 响应式设计

### 断点 1: `max-width: 1200px`
- 内容区改为垂直布局
- 广告区宽度100%,高度固定100px

### 断点 2: `max-width: 768px`
- 容器上边距增加到 `padding-top: 80px`
- 广告区高度减小到60px
- 页脚字体缩小到 `0.7rem`
- 友情链接网格从6列改为3列

---

## 定位总结

| 元素 | 定位方式 | 位置 | Z-Index |
|------|---------|------|---------|
| `.home-container` | relative | 文档流 | - |
| `.menu-bar-fixed` | fixed | top: 0.6rem | 100 |
| `.search-section` | relative | 文档流 | 2 |
| `.ad-space-fixed` | fixed | left/right: 0, top: 13rem | 10 |
| `.move-target-panel` | - | 文档流 | - |
| `CardGrid` | relative | 文档流 | 2 |
| `.fab-container` | fixed | right: 30px, bottom: 30px | 999 |
| `.footer` | relative | 文档流 | 2 |
| `.modal-overlay` | fixed | 全屏 | 1000 |
| `.engine-dropdown-menu` | absolute | top: 100% + 8px | 10001 |

---

## 布局特点总结

1. **层次清晰**: 使用z-index明确定义元素层级
2. **固定元素**: 顶部菜单、侧边广告、FAB按钮固定不动
3. **流式布局**: 主内容区域采用flex垂直布局
4. **响应式**: 针对不同屏幕尺寸优化
5. **交互友好**: 浮动按钮、下拉菜单、弹窗等提供良好的用户体验
6. **背景处理**: 固定背景 + 半透明遮罩提升可读性
