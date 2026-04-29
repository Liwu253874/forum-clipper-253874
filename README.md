# 253874 快速转发 / Forum Clipper for 253874

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/Liwu253874/forum-clipper-253874)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://www.253874.net/)

**一键将网页内容转发到里屋论坛（253874.net）的浏览器扩展。**
**One-click browser extension to forward web content to the 253874.net forum.**

---

## 📖 目录 / Table of Contents

- [功能特点 / Features](#功能特点--features)
- [安装方式 / Installation](#安装方式--installation)
- [使用方法 / Usage](#使用方法--usage)
- [设置选项 / Settings](#设置选项--settings)
- [支持的网站 / Supported Sites](#支持的网站--supported-sites)
- [技术栈 / Tech Stack](#技术栈--tech-stack)
- [隐私说明 / Privacy](#隐私说明--privacy)
- [开发说明 / Development](#开发说明--development)
- [更新日志 / Changelog](#更新日志--changelog)
- [反馈与支持 / Feedback & Support](#反馈与支持--feedback--support)

---

## ✨ 功能特点 / Features

| 功能 | 说明 |
|------|------|
| 🎬 **视频转发** | 支持 Bilibili 和 YouTube 视频一键转发，自动生成 embed 嵌入代码 |
| | Support Bilibili & YouTube video forwarding with auto-generated embed codes |
| 🔍 **智能提取** | 自动识别网页正文，保留段落、图片和列表格式 |
| | Automatically detects article body, preserves paragraphs, images, and lists |
| ✂️ **选中转发** | 支持手动选中部分内容进行精准转发 |
| | Select specific content on the page for precise forwarding |
| 🌐 **站点适配** | 腾讯新闻、知乎、新浪、搜狐等自动优化格式 |
| | Auto-optimized formatting for Tencent News, Zhihu, Sina, Sohu, etc. |
| 📝 **自动填充** | 一键填充论坛发帖表单，无需手动复制粘贴 |
| One-click auto-fill of forum post form — no manual copy-paste needed |
| ⚙️ **灵活设置** | 可自定义标题是否带来源标签（【知乎】【新闻】等） |
| | Customize whether titles include source tags like [Zhihu] or [News] |

---

## 🎬 视频转发功能 / Video Forwarding

**支持的视频平台：**

| 平台 | 识别方式 | 生成代码 |
|------|----------|----------|
| **Bilibili** | 自动识别 URL 中的 BV 号 | `<embed>` 标签嵌入播放器 |
| **YouTube** | 自动识别 URL 中的 v= 参数 | `<embed>` 标签嵌入播放器 |

**使用方式：**
1. 打开 Bilibili 或 YouTube 视频页面
2. 右键点击页面，选择「转发到 253874」
3. 自动跳转论坛发帖页，已填充：
   - **标题**：视频标题
   - **内容**：embed 视频播放器代码
   - **相关链接**：源网页地址
   - **分类**：视频（typeid=8）

---

## 📦 安装方式 / Installation

### 方式一：Chrome 网上应用店（推荐）/ Chrome Web Store (Recommended)

1. 访问 Chrome 应用商店页面（待发布）
2. 点击"添加至 Chrome"
3. Visit the Chrome Web Store page (coming soon)
4. Click "Add to Chrome"

### 方式二：开发者模式安装 / Developer Mode Installation

1. **下载项目 / Download the project**
   ```bash
   # 从 GitHub 下载 / Download from GitHub
   git clone https://github.com/Liwu253874/forum-clipper-253874.git
   ```

2. **打开 Chrome 扩展管理页面 / Open Chrome Extensions page**
   - 地址栏输入：`chrome://extensions/`
   - Enter in address bar: `chrome://extensions/`

3. **开启开发者模式 / Enable Developer Mode**
   - 打开右上角的"开发者模式"开关
   - Toggle "Developer mode" in the top-right corner

4. **加载扩展 / Load the extension**
   - 点击"加载已解压的扩展程序"
   - 选择本项目文件夹
   - Click "Load unpacked"
   - Select this project's folder

5. **完成！/ Done!**
   - 工具栏会出现扩展图标
   - The extension icon will appear in your toolbar

---

## 🚀 使用方法 / Usage

### 基本流程 / Basic Workflow

```
┌─────────────────────────────────────────────────────┐
│  1. 打开任意网页 / Open any webpage                  │
│     (新闻、知乎回答、博客、视频等)                     │
│     (News, Zhihu answers, blogs, videos, etc.)      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  2. 右键点击页面 / Right-click on the page           │
│     （或选中部分内容 / Or select specific content）   │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  3. 选择菜单项 / Select menu item                    │
│     "转发到 253874（填充发帖页）"                     │
│     "Forward to 253874 (Fill Post Page)"            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  4. 自动跳转论坛发帖页 / Auto-redirect to forum post  │
│     标题、内容、图片已自动填充                         │
│     Title, content, and images are auto-filled       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  5. 确认无误后点击发帖 / Review and submit the post  │
└─────────────────────────────────────────────────────┘
```

### 高级技巧 / Advanced Tips

- **精准转发 / Precise Forwarding**: 先用鼠标选中感兴趣的段落，再右键转发，只会转发选中内容
  - Select the paragraph you care about first, then right-click to forward — only selected content will be forwarded

- **完整文章转发 / Full Article Forwarding**: 不选中任何内容，直接右键转发，将提取整篇文章
  - Don't select anything, just right-click to forward — the entire article will be extracted

- **视频转发 / Video Forwarding**: 在 Bilibili/YouTube 视频页右键转发，自动生成 embed 代码并选择"视频"分类
  - Right-click on Bilibili/YouTube video pages — auto-generates embed code and selects "Video" category

- **设置标题格式 / Customize Title Format**: 在设置页面可以开关标题来源标签
  - Toggle source tags in the title on/off in the settings page

---

## ⚙️ 设置选项 / Settings

### 访问设置 / Access Settings

- 右键菜单中选择「⚙️ 转发设置」
- 或在扩展管理页面点击"扩展程序选项"
- Select "⚙️ Clipper Settings" from the right-click menu
- Or click "Extension options" in the extensions management page

### 配置项 / Configuration

| 选项 / Option | 说明 / Description | 默认值 / Default |
|---------------|-------------------|-----------------|
| **标题带来源标签** / Title Source Tags | 开启后标题自动添加【知乎】【新闻】等来源标识 | ✅ 开启 / Enabled |
| | When enabled, titles automatically include source tags like [Zhihu] or [News] | |

> **提示 / Tip**: 设置存储在 `chrome.storage.sync`，支持跨设备同步，修改后即时生效。
> Settings are stored in `chrome.storage.sync` with cross-device sync. Changes take effect immediately.

---

## 🌐 支持的网站 / Supported Sites

| 网站 / Site | 状态 / Status | 特性 / Features |
|-------------|---------------|-----------------|
| **Bilibili 视频** | ✅ 完美支持 | 自动识别 BV 号，生成 embed 播放器，选择"视频"分类 |
| | | Auto-detect BV number, generate embed player, select "Video" category |
| **YouTube 视频** | ✅ 完美支持 | 自动识别视频 ID，生成 embed 播放器，选择"视频"分类 |
| | | Auto-detect video ID, generate embed player, select "Video" category |
| **知乎 / Zhihu** | ✅ 完美支持 | 精确提取当前回答、作者信息、多回答页面定位 |
| | | Precise extraction of current answer, author info, multi-answer page targeting |
| **腾讯新闻 / Tencent News** | ✅ 完美支持 | 自动去除后缀、图片兼容处理 |
| | | Auto-remove suffixes, image compatibility handling |
| **新浪新闻 / Sina News** | ✅ 支持 | 标准文章提取 |
| | | Standard article extraction |
| **搜狐新闻 / Sohu News** | ✅ 支持 | 标准文章提取 |
| | | Standard article extraction |
| **其他网页 / Other Websites** | ✅ 通用支持 | 基于 Readability 的通用全文提取 |
| | | General full-text extraction based on Readability |

---

## 🛠️ 技术栈 / Tech Stack

- **Chrome Extension Manifest V3** — 最新扩展规范
- **Mozilla Readability** — 强大的网页正文提取库
- **原生 JavaScript** — 无框架依赖，轻量高效
- **Chrome Extension Manifest V3** — Latest extension specification
- **Mozilla Readability** — Powerful web article extraction library
- **Vanilla JavaScript** — No framework dependencies, lightweight and efficient

### 项目结构 / Project Structure

```
forum_clipper/
├── manifest.json          # 扩展配置（Manifest V3）/ Extension config
├── background.js          # 后台服务（右键菜单管理）/ Background service (context menu)
├── content.js             # 内容提取核心逻辑 / Core content extraction logic
├── Readability.js         # Mozilla Readability 库 / Mozilla Readability library
├── settings.html          # 设置页面 / Settings page
├── settings.js            # 设置页逻辑 / Settings page logic
├── icons/                 # 扩展图标 / Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── _locales/              # 国际化文件 / Internationalization files
└── README.md              # 说明文档 / This documentation
```

---

## 🔒 隐私说明 / Privacy

| 项目 / Item | 说明 / Description |
|-------------|-------------------|
| 🚫 **不收集个人信息** / No Personal Data Collection | 我们不会收集、存储或传输任何个人信息 |
| | We do not collect, store, or transmit any personal information |
| 🚫 **不上传浏览数据** / No Browsing Data Upload | 您的浏览历史和网页数据仅在本机处理 |
| | Your browsing history and web data are processed only locally |
| ✅ **本地处理** / Local Processing | 所有内容提取和格式转换均在浏览器本地完成 |
| | All content extraction and format conversion happen locally in the browser |
| 🔐 **按需访问** / On-Demand Access | 仅在您主动点击转发时才会访问当前页面内容 |
| | Current page content is only accessed when you actively click to forward |

---

## 💻 开发说明 / Development

### 本地开发 / Local Development

1. **克隆项目 / Clone the project**
   ```bash
   git clone https://github.com/Liwu253874/forum-clipper-253874.git
   cd forum_clipper
   ```

2. **加载到 Chrome / Load into Chrome**
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"，选择项目文件夹
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

3. **开发调试 / Development & Debugging**
   - 修改代码后点击扩展卡片上的"刷新"按钮
   - 使用 Chrome DevTools 调试 content.js（在目标网页按 F12）
   - 使用 Service Worker 调试 background.js（在扩展卡片点击"查看视图：Service Worker"）
   - After code changes, click "Refresh" on the extension card
   - Use Chrome DevTools to debug content.js (press F12 on target page)
   - Use Service Worker debugging for background.js (click "View: Service Worker" on extension card)

### 分支管理 / Branch Management

| 分支 | 用途 |
|------|------|
| **master** | 开发/测试分支，新功能先推到这里验证 |
| **main** | 稳定分支，测试通过后才合并 |

---

## 📝 更新日志 / Changelog

### v0.4.0 (2026-04-29)

**新增功能 / New Features:**
- 🎬 支持 Bilibili 和 YouTube 视频一键转发
  - Support for Bilibili and YouTube video one-click forwarding
- 🎬 自动识别视频页面，生成 embed 嵌入代码
  - Auto-detect video pages and generate embed codes
- 🎬 帖子内容自动使用 embed 标签嵌入视频播放器
  - Post content auto-filled with embed video player
- 🎬 自动选择"视频"分类（typeid=8）
  - Auto-select "Video" category (typeid=8)
- 🎬 相关链接自动填充源网页地址
  - Related link auto-filled with source URL

### v0.3.0 (2026-04-29)

**新增功能 / New Features:**
- 🎬 支持 Bilibili 和 YouTube 视频转发
  - Support for Bilibili and YouTube video forwarding
- 🎬 视频页右键自动识别并生成 embed 嵌入代码
  - Auto-detect video pages and generate embed codes
- 🎬 帖子内容自动使用 embed 标签嵌入视频播放器
  - Post content auto-filled with embed video player
- 🎬 自动选择"视频"分类（typeid=8）
  - Auto-select "Video" category (typeid=8)
- 🎬 相关链接自动填充源网页地址
  - Related link auto-filled with source URL

### v0.2.0 (2026-04-26)

**新增功能 / New Features:**
- 🆕 新增设置页面，支持自定义标题行为
  - Added settings page for customizing title behavior
- 🆕 可开关标题来源标签（【知乎】【新闻】等）
  - Toggle source tags in titles ([Zhihu], [News], etc.)
- 🆕 右键菜单新增「⚙️ 转发设置」入口
  - Added "⚙️ Clipper Settings" entry in context menu

**改进 / Improvements:**
- 🔧 设置存储在 `chrome.storage.sync`，支持跨设备同步
  - Settings stored in `chrome.storage.sync` with cross-device sync

### v0.1.0 (2026-01-05)

**初始版本 / Initial Release:**
- ✨ 支持知乎多回答页面精确提取
  - Support for precise extraction on Zhihu multi-answer pages
- ✨ 优化腾讯新闻图片处理
  - Optimized image handling for Tencent News
- ✨ 改进标题清洗逻辑
  - Improved title cleaning logic

---

## 💬 反馈与支持 / Feedback & Support

| 渠道 / Channel | 链接 / Link |
|----------------|------------|
| 🐛 **GitHub Issues** | https://github.com/Liwu253874/forum-clipper-253874/issues |
| 💬 **论坛讨论 / Forum Discussion** | https://www.253874.net/ |
| 📧 **项目地址 / Project** | https://github.com/Liwu253874/forum-clipper-253874 |

---

## 📄 许可证 / License

MIT License — 自由使用、修改、分发 / Free to use, modify, and distribute.

---

**Made with ❤️ for the 253874.net community**
