# zhoujinq.github.io

个人主页：一个 `index.html` + 本地素材，没有构建步骤，没有外部请求，断网也能打开。

线上：<https://zhoujinq.github.io/> ｜ 版本 v2.2.0（2026-11-22）

## 结构

```
index.html                  结构、样式、终端与覆盖层脚本，全在这里
assets/maple-*.woff2        Maple Mono CN 子集（正文 / 粗体）
assets/shot-*.webp|svg      9 个项目卡的界面截图
assets/life-*.webp|jpg      生活区素材
assets/particles.js         首屏粒子背景
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
| 项目卡（前 3 个常展） | `<section id="projects">` 里的 `<article class="card" data-id="pN">` |
| 项目书里的后 6 个 | 同一个 section 内 `<details class="project-book">` 下的卡片 |
| 项目详情覆盖层 | 文末 `<template id="tpl-pN">`，含“公开网站 / 代码仓库”两条外链 |
| 终端里的文件与命令 | `<script id="shell-engine">` 里的 `PROJECTS`、`FILES`、`commands` |
| 最近更新日期 | `.last-update` 一行 |
| 配色 | `:root`；另有一处候选覆盖，改色前先读 `progress.md` §3 |
| 分享卡 | 用无头 Chrome 在 1200×630 重新截 `_build/og-src.html` |

卡片和图层的 `data-id`、`data-name`、`tpl-pN` 必须一一对应；新增项目时同时补测试。

## 字体

正文 Maple Mono CN（OFL），**只保留页面实际用到的约 1000 个字符**（整包中文版 18MB）。
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

仓库名必须是 `zhoujinq.github.io`，Pages 才伺服在根域名。推 `main` 自动构建；页脚版本号链到 `releases/tag/v2.2.0`，发版时记得同步打 tag。

## 已知待办

- `assets/og.png` 还是旧版，视觉稳定后再换。
- `progress.md` 是协作状态文件，改完仓库要更新 §2 与 §6。
