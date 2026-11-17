# 个人主页 · 上线三步

页面就一个文件：`index.html`（CSS 和 JS 全在里面，不依赖任何外部资源，断网也能开）。

## 1. 本地先看

双击 `index.html`。终端那一块会自动打字，打完停在光标上。

## 2. 放简历 PDF

把最新的简历 PDF 改名成 `resume.pdf`，和 `index.html` 放在同一个文件夹。
页脚「简历 PDF」那个链接指向 `./resume.pdf`，没放就会 404。

## 3. 上线（GitHub Pages）

你的账号已经有仓库权限，**仓库名必须是 `zhoujinq.github.io`** —— 只有这个命名才能拿到 `https://zhoujinq.github.io` 这个根域名。

网页操作版：
1. 新建仓库，名字填 `zhoujinq.github.io`，选 Public。
2. 把 `index.html` 和 `resume.pdf` 拖进去，Commit。
3. Settings → Pages → Source 选 `Deploy from a branch` → 分支 `main` / 目录 `/ (root)` → Save。
4. 等 1–2 分钟，访问 `https://zhoujinq.github.io`。

命令行版：
```bash
cd <本文件夹>
git init
git add index.html resume.pdf
git commit -m "init homepage"
git branch -M main
git remote add origin https://github.com/zhoujinq/zhoujinq.github.io.git
git push -u origin main
```

## 为什么是 github.io（而不是 workbuddy.host）

- `zhoujinq.github.io` 是 **GitHub Pages**：把静态文件放进一个叫 `zhoujinq.github.io` 的仓库，GitHub 就把它当站点伺服。免费、无需备案、全球 CDN。
- 蒋炎岩老师的 `jiangyy.github.io` 就是这个机制，全球大量工程师/教授都这么用，**它本身就是"个人主页"的常见形态**，不是 GitHub 的员工页面。
- WorkBuddy 发布的 `.app.workbuddy.host` 是**产品内的应用分享链接**（带 `sharecode`），本质是"我用工具做的任务"，不是站点。放简历里会显得像内部链接。

## 一个要提前知道的坑：国内访问

`github.io` 在国内**时快时慢，偶尔打不开**。你的读者是北京的 HR，这一点要提前想好。

三个处理办法，按成本排序：
1. **先上线，自己用手机 4G 测一次**能不能打开。能开就先不动，绝大多数情况够用。
2. 同时部署一份到 **EdgeOne Pages / Cloudflare Pages** 做备用，简历里只放主域名，面试时口头补一句备用地址。
3. 买个域名（`gavinzhou.dev` 之类，几十到一百块一年），在 Pages 里配 Custom domain。**有自己域名最稳**，也最像一个"个人主页"而不是"一个 GitHub 仓库"。

## 之后要改什么

- **改文案**：直接改 `index.html` 里的中文，改完重新 commit。
- **加项目**：复制一个 `<div class="card">…</div>`，改标题和描述。
- **换配色**：只改 `:root` 里的 `--blue`（现在是 `#4D6BFE`，DeepSeek 那种蓝）。
- **换域名**：以后买了自己的域名，在仓库 Settings → Pages → Custom domain 填进去即可，页面本身不用改。

## 说明一句

参考的是蒋炎岩老师主页那种「极简 + 等宽字体 + 大量留白」的气质，以及你给的终端截图里那句 `command not found: claude`。**没有逐像素复制**——他的站点抓不到内容，我按那个思路重做了一版，终端是纯前端假装的，打字效果由 40 行原生 JS 实现，没有依赖。

想更像终端的话，还可以加两个小东西（你说要我再加）：
- 按 `↑` 能翻历史命令（纯装饰，不真执行）
- 页面左下角常驻一个 `~$` 光标
