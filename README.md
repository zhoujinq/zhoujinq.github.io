# zhoujinq.github.io

个人主页：一个 `index.html` + 本地素材，没有构建步骤，没有外部请求，断网也能打开。

线上：<https://zhoujinq.github.io/> ｜ 版本 v3.1.0（2026-11-23）

## 页面结构

首屏（像素名字、Maple Mono 三行简介、自动聚焦且光标闪烁的终端）之后只有两大内容块：**项目**（两行九项目）→ **关于我**（简介、打卡、三项热爱、折叠履历、目标与信念、折叠的相信 / 喜欢 / 讨厌清单）。桌面关于我采用“日常 / 思考”双栏紧凑布局，在 1366×625 内容区、四层均折叠时整区约 608px，可在一屏内完整显示；手机保持单栏。

项目区只有两行：第一行是 3 张主卡（销售助手 / 模型斩杀线 / Personal AI）；第二行由 04 API 商机雷达 / 05 个人理财投资助手 / 06 日语 N1 三张缩小微倾斜图卡在上，07 破万卷、08 外卖吃啥、09 简历工坊 Pro 分别夹在其下。09 缩至列宽 82%、高度 58px，并以 -1.8° 倾斜，宽度接近 06 且明显小于主卡。详情里直接贴原始网址，不放代码仓库；销售助手分别标注真实使用规模与虚构演示数据。

首屏三张主图使用头部预加载、立即加载和同步解码，卡片默认可见，滚动入场只保留位移；王者图标已压缩至 253×256、约 18.4 KB，避免冷启动时大图争抢带宽。

履历与三个喜恶清单默认折叠；折叠态使用与 09 夹页同族的 `#eadcc3` 暖纸底、22px 大三角和“已折叠 · 点击展开”提示，展开后退底并可再次收起。

```
index.html                  结构、样式、终端与覆盖层脚本，全在这里
assets/maple-*.woff2        Maple Mono CN 子集（正文 / 粗体）
assets/shot-sales.svg       01 销售助手工作流示意
assets/shot-cutline.svg     02 模型斩杀线示意
assets/shot-growing.svg     03 Personal AI 示意
assets/shot-*.webp          04–09 次卡与折叠页截图
assets/life-*.webp|jpg      关于我三项热爱素材
assets/particles.js         首屏粒子（vendored particles.js）
assets/og.png               社交分享卡 1200×630
tests/page.test.js          页面结构、文案口径、外链
tests/shell.test.js         终端命令
tests/streak.test.js        北京时间连胜计算
tests/responsive.html       390 / 1440 同源 iframe 验收页
progress.md                 协作状态、设计锚点与变更记录
```

## 本地看

双击 `index.html` 即可；改文案时建议起服务：

```bash
python -m http.server 8080
# http://127.0.0.1:8080
```

## 改内容

| 想改什么 | 改哪里 |
|---|---|
| 项目卡 | 主卡 3 个 `<article class="card">`、次卡 3 个 `.card secondary`、折叠页 3 个 `.card folded` |
| 项目详情 | 文末 `<template id="tpl-pN">`，只保留一条文字与 href 一致的原始网址 |
| 终端里的文件与命令 | `<script id="shell-engine">` 里的 `PROJECTS`、`FILES`、`commands` |
| 最近更新日期 | `.last-update` 一行 |
| 配色 | `:root`；另有一处候选覆盖，改色前先读 `progress.md` §3 |
| 粒子手感 | 文末 `particlesJS` 配置：`interactivity.detect_on` 必须是 `"window"`，否则文字区不响应鼠标 |

卡片和图层 `data-id`、`data-name`、`tpl-pN` 必须一一对应，数量改动要同步测试。

## 字体

正文 Maple Mono CN（OFL），**只保留页面实际用到的约 900 个字符**（整包中文版 18MB）。
改了文案出现新字，就要重新子集化，否则新字回退系统字体：

```python
from fontTools import subset
chars = set(open("index.html", encoding="utf-8").read()) | {chr(c) for c in range(0x20, 0x7f)}
# 再按 chars 对 MapleMono-CN-Regular.ttf / -Bold.ttf 做 woff2 子集
```

## 测试与上线

```bash
node --test tests/page.test.js tests/shell.test.js tests/streak.test.js   # 34 项
```

仓库名必须是 `zhoujinq.github.io`，Pages 才伺服在根域名。推 `main` 自动构建；页脚版本号是静态文本，不再外链 Release。

## 已知待办

- `assets/og.png` 还是旧版，视觉稳定后再换。
- `progress.md` 是协作状态文件，改完仓库要更新 §2 与 §6。
