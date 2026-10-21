<div align="center">

  <img src="docs/images/app-icon.jpg" alt="知微错题本 App Icon" width="120" height="120" style="border-radius: 26px; box-shadow: 0 10px 30px rgba(30,86,160,0.22); margin-bottom: 16px;" />

  # 知微错题本 (ZhiWei Note)
  
  **见微知著 · 省思改错 · 本地优先 · 登峰造极**

  一款专为学生、考研考公党、竞赛生与终身学习者打造的**跨平台本地优先（Local-First）智能错题管理与深度复盘系统**。<br/>
  融合 **GoodNotes 拟物学科体系**、**艾宾浩斯复盘与连续打卡日历**、**Apple Pencil 真实压感手写演练**、**Markdown + LaTeX 公式多模态精析** 与 **Git 免服务器私有云双向漫游**。

  <p align="center">
    <a href="https://github.com/xuewexin/zhiwei-notebook/releases/latest"><img src="https://img.shields.io/badge/Release-v1.6.8-1e56a0.svg?style=flat-square" alt="Version"></a>
    <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iPadOS%20%7C%20Windows%20%7C%20PWA-475569.svg?style=flat-square" alt="Platform">
    <img src="https://img.shields.io/badge/Storage-100%25%20Local--First-047857.svg?style=flat-square" alt="Local First">
    <img src="https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-b45309.svg?style=flat-square" alt="Stack">
    <img src="https://img.shields.io/badge/Math-KaTeX%20LaTeX-6d28d9.svg?style=flat-square" alt="KaTeX">
    <img src="https://img.shields.io/badge/License-MIT-be123c.svg?style=flat-square" alt="License">
  </p>

  <p align="center">
    <a href="#-最新版本极速下载-v168"><b>🚀 极速下载</b></a> &nbsp;•&nbsp;
    <a href="#-核心特色与功能矩阵"><b>✨ 核心特色</b></a> &nbsp;•&nbsp;
    <a href="#-全平台精选界面巡礼"><b>🖼️ 界面巡礼</b></a> &nbsp;•&nbsp;
    <a href="#-各端安装与使用指南"><b>📦 安装指南</b></a> &nbsp;•&nbsp;
    <a href="#-技术架构"><b>🛠️ 架构设计</b></a>
  </p>

</div>

---

## 📥 最新版本极速下载 (v1.6.8)

本项目提供全平台打包好的纯净安装包，无任何强制联网、无广告，下载即用：

| 平台 | 安装包名称 | 文件大小 | 适用设备与特性 | 直接下载链接 |
| :--- | :--- | :--- | :--- | :--- |
| 💻 **Windows 原生版** | `zhiwei-notebook-v1.6.8-windows.exe` | ~1.9 MB | **Windows 独立原生桌面软件**（双击即开、原生目录浏览、官方发布页直达升级） | [点击下载 EXE](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-windows.exe) |
| 💻 **Windows 便携版** | `zhiwei-notebook-v1.6.8-windows-portable.zip` | ~1.3 MB | Windows 绿色免安装压缩包（解压即开，支持放入 U 盘随身携带） | [点击下载 ZIP](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-windows-portable.zip) |
| 🤖 **Android 原生版** | `zhiwei-notebook-v1.6.8-android.apk` | ~4.0 MB | 安卓手机 / 安卓平板（复盘题量与出处自定义、三档评分、底栏等距排版、复盘日历） | [点击下载 APK](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-android.apk) |
| 🍎 **iPadOS / iOS** | `zhiwei-notebook-v1.6.8-ipad.ipa` | ~3.4 MB | iPad 全系列 / iPhone（原生 ARM64 编译，支持爱思助手/巨魔商店免费侧载） | [点击下载 IPA](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-ipad.ipa) |
| 🍎 **iPad 原生工程** | `zhiwei-notebook-v1.6.8-ios-xcode-project.zip` | ~1.8 MB | 包含完整 Xcode 工程源码，可在 Mac 电脑直接打开真机编译调试 | [点击下载工程 ZIP](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-ios-xcode-project.zip) |
| 🌐 **iPad / PC 局域网版** | `启动iPad局域网极速连接.bat` | 脚本文件 | **免安装、免证书、永不过期**。iPad Safari 添加到主屏幕秒变全屏桌面 App | [查看使用步骤](#-方案二ipad-专属-pwa-桌面原生体验免签名) |
| 💻 **本地运行脚本** | `启动错题本.bat` | 脚本文件 | 双击脚本即开，搭配本地 Node.js 极速做题 | [查看运行方法](#-windows-桌面端使用指南) |

---

## ✨ v1.6.8 重大升级亮点

1. 🎯 **每日复盘题目数量与出处科目自由配置**：
   - **每日复盘题量自行设定**：默认每天 5 道题，支持快捷选择 3/5/10/15/20 题或任意自定义数值；
   - **记忆曲线智能排期抽取**：系统按艾宾浩斯遗忘曲线对错题进行优先级排序（逾期未复盘最久、记忆最脆弱的题目排在最前）；
   - **题目出处与分类范围自由切换**：
     - **不区分文件夹（默认）**：全学科统一按记忆衰减紧迫度综合排序，高效抗遗忘；
     - **指定文件夹**：可固定单个学科（如高数），也可多选多个学科自由组合；
   - 交互式复盘设置面板即调即存，即时重塑今日复盘任务队列。
2. 🧠 **今日复习「复习完成」三档掌握度评级与艾宾浩斯智能排期**：
   - 「今日复盘」速通卡与「错题详情」复盘卡新增「完全掌握」、「基本掌握」与「不熟悉」三档评分；
   - 点击任一档位即时智能计算并展示下次复盘日期，同时自动完成今日复盘打卡、点亮连续学习天数（Streak）。
3. 📱 **移动端底部快捷导航栏排版重构与等距优化**：
   - 采用现代化等距栅格架构（Grid 5 等分），确保「全部科目、全部错题、新增题、今日复盘、个人主页」在全尺寸手机屏幕上保持舒展呼吸感与均衡对称。
4. 🔄 **个人主页三端互通（Windows/Android/iPad）图文教程与架构配图**：
   - 在个人主页新增「三端互通与 Git 仓库同步图文教程」卡片（默认优雅折叠），内置 200 DPI 双向漫游拓扑配图。
3. 🛡️ **移动端键盘遮挡底栏与模态弹窗深度修复**：
   - 软键盘唤起或模态窗开启时，移动端底栏智能隐藏；键盘收起即时归位；
   - 文件夹新建与编辑弹窗提升为全局顶级 Portal 渲染（`z-[9999]`），彻底杜绝内容被底栏截断。
4. 📅 **今日复盘打卡日历表与连续学习天数（艾宾浩斯复盘引擎）**：
   - 连续打卡天数（Streak）统计与交互式月度打卡足迹日历网格，一键完成每日复盘。
5. 🎨 **学者纯色典雅设计，彻底剔除渐变色与杂色**：
   - 6 款沉静典雅的书卷纯色（知微蓝、紫罗兰、翡翠绿、琥珀橙、蔷薇红、水墨灰），纯平极简现代设计。
6. 🌐 **版本更新直达 GitHub 官方发行页面**：
   - 针对部分手机厂商系统直接下载 APK 后拦截并不提示安装的问题，更新时直接唤起系统外部默认浏览器打开 GitHub Releases 官方版本发行页面。

---

## 🌟 核心特色与功能矩阵

<div align="center">

| 功能维度 | 核心特性 | 学习场景与价值 |
| :--- | :--- | :--- |
| 📅 **艾宾浩斯记忆与打卡日历** | • 艾宾浩斯临界点智能排程<br/>• 连续打卡天数（Streak）统计<br/>• 交互式月度足迹日历网格 | 遵循记忆遗忘规律，避免“录了不看”的死循环；以连击天数激发学习成就感 |
| 📂 **GoodNotes 拟物学科体系** | • 无限级学科与考点层级<br/>• 8 款书卷封皮与专属矢量徽章<br/>• 动态掌握度环形进度盘 | 搭建结构化知识大厦，从宏观学科（高数/物化/算法）到微观考点井井有条 |
| 📝 **Markdown + LaTeX 多模态笔记** | • KaTeX 数学公式实时解析<br/>• 多语言代码块语法高亮<br/>• 标准答案折叠（防剧透自测） | 完美满足数理推导、算法分析、文科长难句等高阶题型的精细化整理诉求 |
| ✍️ **压感真实手写草稿演练板** | • 硬件级 PointerEvent 压感<br/>• 手掌防误触（Pen Only 模式）<br/>• 多页草稿推导保存与归档 | 还原纸质笔记本演算推导触感，原汁原味记录考场推导灵感与顿笔痕迹 |
| 🔄 **多次做题演练历程分区** | • 建立多次复盘时间轴<br/>• 结果/耗时/演算草稿/反思记录<br/>• 动态掌握度状态机联动 | 告别“做过一遍就算学会”的盲目，客观记录同一道题从不会到精通的全程蜕变 |
| ☁️ **本地优先 + Git 免服务器云同步** | • 100% 离线可用，断网秒开<br/>• 支持 GitHub / Gitee 私有仓库<br/>• 三端互通，无中心化收费服务器 | 数据 100% 归属于你，绝不依赖第三方可能停运的云服务，隐私与安全坚如磐石 |
| 🎨 **学者纯色典雅设计与壁纸** | • 6 款舒适耐看的沉静纯色<br/>• 自定义本地背景壁纸与透明度<br/>• 全平台 100% 全局自适应 | 拒绝刺眼荧光与杂乱渐变，打造沉浸、专注、纯粹的书卷学习空间 |
| 🛡️ **覆盖式无损升级保障** | • 升级逻辑与本地数据库物理隔离<br/>• 自动清理旧构建缓存<br/>• 升级过程绝不损坏或丢失本地错题 | 放心升级新功能，每一次更新都安心无忧 |

</div>

---

## 🖼️ 全平台精选界面巡礼

<div align="center">

### 💻 宽屏桌面端与 iPad 平板大屏视图
*拟物化 GoodNotes 学科封面、多级目录折叠导航、搜索与 Git 状态面板*

<img src="docs/images/desktop-showcase.png" alt="知微错题本桌面与平板视图" width="96%" style="border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 12px 36px rgba(0,0,0,0.06); margin-bottom: 24px;" />

---

### 📖 错题精细研读与多模态复盘视图
*标准解析折叠防剧透、LaTeX 数学公式秒级渲染、历次演练做题记录与解题心得*

<img src="docs/images/desktop-detail-view.png" alt="知微错题本错题精细研读视图" width="96%" style="border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 12px 36px rgba(0,0,0,0.06); margin-bottom: 24px;" />

---

### 📅 艾宾浩斯复盘计划与连续打卡日历
*连续学习天数（Streak）徽章、历史最长连击、累计研习统计与月度足迹日历*

<img src="docs/images/review-showcase.png" alt="知微错题本复盘与打卡日历" width="96%" style="border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 12px 36px rgba(0,0,0,0.06); margin-bottom: 24px;" />

---

### 📱 移动端与手机竖屏触控专属设计
*左侧：手机端学科分类与错题卡片流 ｜ 右侧：艾宾浩斯复盘与连续学习打卡日历*

<img src="docs/images/mobile-duo-showcase.png" alt="移动端双视图展示" width="80%" style="border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 12px 36px rgba(0,0,0,0.07); margin-bottom: 24px;" />

---

### 🔄 三端互通与 Git 仓库同步拓扑
*Windows 电脑、Android 手机与 iPad 平板依托 Gitee / GitHub 私有仓库双向漫游*

<img src="docs/images/sync-tutorial-diagram.png" alt="知微错题本三端互通架构图" width="96%" style="border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 12px 36px rgba(0,0,0,0.06); margin-bottom: 12px;" />

</div>

---

## 🚀 各端安装与使用指南

### 🤖 Android 安卓端安装
1. 在 Android 设备上下载 [**`zhiwei-notebook-v1.6.8-android.apk`**](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-android.apk)；
2. 点击安装包，若系统提示请允许「允许安装来自此来源的应用」；
3. 安装完成后打开，即可畅享专门为手机端适配的自适应顶栏、防软键盘遮挡、相机扫题与双击返回体验。

---

### 🍎 iPadOS / iOS 端安装

#### 方案一：使用爱思助手安装原生 `.ipa`（最推荐 ⭐）
1. 下载 [**`zhiwei-notebook-v1.6.8-ipad.ipa`**](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-ipad.ipa) 到电脑；
2. 用数据线将 iPad 连接到电脑，打开电脑端「爱思助手」；
3. 进入 **「工具箱」➔「IPA 签名」**，导入下载好的 `.ipa` 文件；
4. 选择 **「使用 Apple ID 签名」**，输入你自己的 Apple ID 即可免费签名并安装到 iPad；
5. 首次在 iPad 上打开时，进入「设置」➔「通用」➔「VPN 与设备管理」中点击「信任开发者证书」即可畅享！

#### 方案二：iPad 专属 PWA 桌面原生体验（免签名、永不过期）
1. 确保电脑与 iPad 连接在同一个 Wi-Fi 局域网下；
2. 电脑双击运行根目录下的 `启动iPad局域网极速连接.bat`；
3. 控制台会显示局域网访问地址（例如 `http://192.168.1.xxx:5173`）；
4. iPad 打开 Safari 访问该地址，点击右上角 **「分享」按钮 ➔「添加到主屏幕」**；
5. iPad 桌面自动生成专属高清图标，点击即可 100% 全屏独立运行，完美支持 Apple Pencil 压感手写与离线使用！

---

### 💻 Windows 桌面端使用指南

#### 方式一：直接运行 Windows 单文件版 EXE（最推荐 ⭐）
1. 下载 [**`zhiwei-notebook-v1.6.8-windows.exe`**](https://github.com/xuewexin/zhiwei-notebook/releases/download/v1.6.8/zhiwei-notebook-v1.6.8-windows.exe)（或下载绿色便携版 ZIP 解压）；
2. 直接双击打开即可运行！无需安装任何额外环境，独立桌面窗口、无浏览器地址栏干扰，内嵌高精度手写与本地数据引擎。

#### 方式二：一键批处理脚本启动
直接双击项目根目录下的 **`启动错题本.bat`**，系统将自动拉起本地数据存储服务与浏览器前端界面！

#### 方式三：开发者源码启动
```bash
# 1. 克隆代码仓库
git clone https://github.com/xuewexin/zhiwei-notebook.git
cd zhiwei-notebook

# 2. 安装依赖
npm install

# 3. 启动开发服务器 (自动打开 http://localhost:5173)
npm run dev

# 4. 构建生产产物
npm run build
```

---

## 🛠️ 技术架构

```
知微错题本 (ZhiWei Note)
├── Web / UI 层: React 19 + TypeScript + Vite + TailwindCSS 4
├── 数学与代码引擎: KaTeX + PrismJS + Marked
├── 笔迹演练引擎: PointerEvent + Pressure Sensitivity + Palm Rejection
├── 跨端原生容器: 
│   ├── Windows 桌面端: .NET 9 + Microsoft Edge WebView2 (单文件独立打包)
│   ├── Android 移动端: Capacitor 8 (Android SDK 34)
│   └── iPadOS 平板端: Capacitor 8 (iOS SDK 17+ Swift Package Manager)
├── 数据持久化: 
│   ├── Client 模式: IndexedDB / LocalStorage (纯本地秒级读写)
│   ├── Server 模式: Express + Node.js (本地磁盘文件持久化)
│   └── Cloud 模式: Git (GitHub / Gitee 私有仓库双向漫游)
└── 自动化打包: GitHub Actions (macOS-14 ARM64 Xcode Runner)
```

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。欢迎 Star、Fork 与提交反馈改进！
