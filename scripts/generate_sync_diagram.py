import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

plt.rcParams['font.sans-serif'] = ['Microsoft YaHei', 'Noto Sans SC', 'SimHei', 'Segoe UI']
plt.rcParams['axes.unicode_minus'] = False

fig, ax = plt.subplots(figsize=(12, 7.8), dpi=200)
ax.set_facecolor('#f8fafc')
fig.patch.set_facecolor('#f8fafc')

ax.set_xlim(0, 1200)
ax.set_ylim(0, 780)
ax.axis('off')

# 1. Header
ax.text(600, 740, "知微错题 · 三端互通与 Git 云端同步架构", 
        fontsize=22, fontweight='bold', color='#0f172a', ha='center', va='center')
ax.text(600, 708, "无需中间收费服务器 · 依托 Gitee (码云) / GitHub 免费私有仓库 · 数据 100% 掌握在自己手中", 
        fontsize=11.5, color='#64748b', ha='center', va='center')

# 2. Central Cloud Hub (Gitee / GitHub Private Repo)
cloud_box = patches.FancyBboxPatch((380, 480), 440, 180, boxstyle="round,pad=10,rounding_size=20",
                                   facecolor='#ffffff', edgecolor='#1e56a0', linewidth=2.5)
ax.add_patch(cloud_box)

ax.text(600, 625, "Gitee / GitHub 专属私有错题仓库", 
        fontsize=16, fontweight='bold', color='#1e56a0', ha='center', va='center')
ax.text(600, 592, "https://gitee.com/your-username/my-mistake-notebook.git", 
        fontsize=10.5, color='#475569', ha='center', va='center')

# Cloud Tags
tag_y = 530
tags = [
    ("100% 本地优先", "#eff6ff", "#1e56a0"),
    ("私有加密存储", "#f0fdf4", "#047857"),
    ("零费用无限容量", "#fef3c7", "#b45309"),
    ("全历史版本追溯", "#f3e8ff", "#6d28d9")
]
tag_xs = [435, 545, 655, 765]
for i, (text, bg, fg) in enumerate(tags):
    t_box = patches.FancyBboxPatch((tag_xs[i] - 46, tag_y - 14), 92, 28, boxstyle="round,pad=4,rounding_size=6",
                                  facecolor=bg, edgecolor=fg, linewidth=0.8)
    ax.add_patch(t_box)
    ax.text(tag_xs[i], tag_y, text, fontsize=9.5, fontweight='bold', color=fg, ha='center', va='center')

# 3. Three Device Nodes
devices = [
    {
        "badge": "Windows 桌面端",
        "subtitle": "PC / 笔记本电脑独立原生版 (EXE)",
        "desc": ["• 舒适双栏做题、审题与知识点归类", "• 键盘极速录入与 LaTeX 矩阵公式编辑", "• 本地磁盘数据离线优先，随开即用"],
        "x": 60, "y": 255, "w": 320, "h": 165,
        "color": "#1e56a0", "arrow_from": (220, 420), "arrow_to": (430, 500)
    },
    {
        "badge": "Android 安卓端",
        "subtitle": "安卓手机 / 安卓平板原生版 (APK)",
        "desc": ["• 碎片时间随时随地复盘、自测与查阅", "• 相机拍摄题目试卷与标准答案上传", "• 每日艾宾浩斯复盘打卡连续点亮"],
        "x": 440, "y": 255, "w": 320, "h": 165,
        "color": "#047857", "arrow_from": (600, 420), "arrow_to": (600, 480)
    },
    {
        "badge": "iPadOS / iOS 端",
        "subtitle": "iPad 全系列平板 / iPhone (IPA / PWA)",
        "desc": ["• Apple Pencil 真实硬件压感草稿纸", "• 屏幕演练手写推导、订正与订正留痕", "• 沉浸式手掌防误触（Pen Only 模式）"],
        "x": 820, "y": 255, "w": 320, "h": 165,
        "color": "#6d28d9", "arrow_from": (980, 420), "arrow_to": (770, 500)
    }
]

for dev in devices:
    # Card box
    d_box = patches.FancyBboxPatch((dev["x"], dev["y"]), dev["w"], dev["h"], boxstyle="round,pad=10,rounding_size=18",
                                   facecolor='#ffffff', edgecolor='#cbd5e1', linewidth=1.5)
    ax.add_patch(d_box)
    
    # Badge
    b_box = patches.FancyBboxPatch((dev["x"] + 16, dev["y"] + dev["h"] - 36), 140, 24, boxstyle="round,pad=3,rounding_size=6",
                                  facecolor=dev["color"], edgecolor=dev["color"])
    ax.add_patch(b_box)
    ax.text(dev["x"] + 86, dev["y"] + dev["h"] - 24, dev["badge"], 
            fontsize=11.5, fontweight='bold', color='#ffffff', ha='center', va='center')
    
    ax.text(dev["x"] + 20, dev["y"] + dev["h"] - 54, dev["subtitle"], 
            fontsize=9.5, color='#64748b', ha='left', va='center')
    
    # Details
    for idx, d_text in enumerate(dev["desc"]):
        ax.text(dev["x"] + 18, dev["y"] + dev["h"] - 84 - idx * 24, d_text, 
                fontsize=10, color='#334155', ha='left', va='center')
        
    # Bi-directional Arrow
    af_x, af_y = dev["arrow_from"]
    at_x, at_y = dev["arrow_to"]
    ax.annotate("", xy=(at_x, at_y), xytext=(af_x, af_y),
                arrowprops=dict(arrowstyle="<|-|>", color=dev["color"], lw=2.2, mutation_scale=16))
    ax.text((af_x + at_x)/2, (af_y + at_y)/2 + 10, "Git 双向同步 (Push / Pull)", 
            fontsize=9.5, fontweight='bold', color=dev["color"], ha='center', va='center',
            bbox=dict(boxstyle="round,pad=2.5", facecolor='#ffffff', edgecolor=dev["color"], lw=0.8))

# 4. Bottom 3 Steps Workflow Strip
step_box = patches.FancyBboxPatch((60, 35), 1080, 180, boxstyle="round,pad=10,rounding_size=18",
                                  facecolor='#ffffff', edgecolor='#e2e8f0', linewidth=1.5)
ax.add_patch(step_box)

ax.text(600, 184, "轻松 3 步完成配置 · 畅享永久三端多设备互通", 
        fontsize=13, fontweight='bold', color='#0f172a', ha='center', va='center')

steps = [
    {
        "num": "1",
        "title": "新建免费私有仓库",
        "desc": "推荐登录 Gitee (码云) 国内秒连直达\n点击右上角新建仓库，务必选择「私有」\n创建完成后复制 HTTPS 仓库链接地址",
        "color": "#1e56a0", "x": 100
    },
    {
        "num": "2",
        "title": "生成访问密钥 (Token)",
        "desc": "进入 Gitee 设置 -> 安全设置 -> 私人令牌\n点击生成新令牌，权限勾选 projects\n生成后即刻复制 Token 密钥字符串备用",
        "color": "#b45309", "x": 480
    },
    {
        "num": "3",
        "title": "各端填入一键开启漫游",
        "desc": "在 Windows 电脑、安卓手机与 iPad 上\n进入个人主页 -> Git 云端同步填入配置\n点击同步，题库与手写推导实时全通",
        "color": "#047857", "x": 860
    }
]

for s in steps:
    # Circle step number
    circle = plt.Circle((s["x"] + 24, 110), 16, color=s["color"])
    ax.add_patch(circle)
    ax.text(s["x"] + 24, 110, s["num"], fontsize=12, fontweight='bold', color='#ffffff', ha='center', va='center')
    
    # Step title
    ax.text(s["x"] + 54, 110, s["title"], fontsize=12.5, fontweight='bold', color='#1e293b', ha='left', va='center')
    
    # Step desc
    ax.text(s["x"] + 20, 72, s["desc"], fontsize=9.5, color='#64748b', ha='left', va='center', linespacing=1.35)

plt.tight_layout()

# Save outputs
os.makedirs('public', exist_ok=True)
os.makedirs('docs/images', exist_ok=True)

out1 = 'public/sync-tutorial-diagram.png'
out2 = 'docs/images/sync-tutorial-diagram.png'

plt.savefig(out1, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
plt.savefig(out2, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()

print('Saved clean sync diagram successfully to:', out1, 'and', out2)
