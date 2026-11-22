# zhoujinq.github.io

个人主页：一个 `index.html` + 本地素材，没有构建步骤，没有外部请求，断网也能打开。

线上：<https://zhoujinq.github.io/> ｜ 版本 v2.3.0（2026-11-22）

## 页面结构

四大块：**首屏**（像素名字、三行简介、终端）→ **项目**（只放 3 个）→ **关于我**（默认折叠）→ **生活**。

项目区只展示 3 个能点开的东西，每个只给一个公开网站链接；代码仓库不上首页。

```
index.html                  结构、样式、终端与覆盖层脚本，全在这里
assets/maple-*.woff2        Maple Mono CN 子集（正文 / 粗体）
assets/shot-sales.svg       01 销售助手工作流示意
assets/shot-n1.webp         02 N1 备考看板截图
assets/shot-book.webp       03 记账投资助手截图
assets/life-*.webp|jpg      生活区素材
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
| 项目卡 | `<section id="projects">` 里的 3 个 `<article class="card" data-id="pN">` |
| 项目详情 | 文末 `<template id="tpl-pN">`，只保留一条 `打开网站 ↗` 外链 |
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
node --test tests/page.test.js tests/shell.test.js tests/streak.test.js   # 31 项
```

仓库名必须是 `zhoujinq.github.io`，Pages 才伺服在根域名。推 `main` 自动构建；页脚版本号是静态文本，不再外链 Release。

## 已知待办

- `assets/og.png` 还是旧版，视觉稳定后再换。
- `progress.md` 是协作状态文件，改完仓库要更新 §2 与 §6。
