# zhoujinq.github.io

个人主页。一个 HTML 文件 + 两个字体文件 + 一份简历 PDF，没有构建步骤，没有外部请求。

## 结构

```
index.html                  全部结构、样式、脚本
assets/maple-regular.woff2  Maple Mono CN 子集（正文）
assets/maple-bold.woff2     Maple Mono CN 子集（粗体，只含用到的字）
assets/og.png               社交分享卡，1200×630（源文件 _build/og-src.html）
resume.pdf                  简历，A4
```

## 本地看

双击 `index.html` 就行。字体是相对路径，双击也能加载。

或者起个服务（改完刷新更顺）：

```bash
python -m http.server 8080
# http://127.0.0.1:8080
```

## 改内容

| 想改什么 | 改哪里 |
|---|---|
| 项目文案 | `index.html` 里 `<article class="proj" id="p1">` 那一块，四段结构：为什么做 / 怎么做 / 效果 / 栈 |
| 项目效果截图 | 把 `<figure class="shot">` 里的 `<div class="shot-frame">…</div>` 换成 `<img src="assets/p1.png" alt="销售辅助系统界面">` |
| 终端里的命令 | 文末 `<script>` 里的 `CMD` 对象，加一个 key 就行；中文别名写在 `zh:[…]` |
| 顶栏提示符 | `<div class="cwd">` |
| 配色 | `:root` 里的 `--accent`（主题色只有一个） |
| 分享卡 | 改 `_build/og-src.html`，用 headless Chrome 在 1200×630 下重新截图 |

## 字体

正文用 Maple Mono CN（OFL 授权），但**只保留了页面实际用到的 643 个字符**——
整包中文版有 18MB，子集后 134KB。所以：**改了文案如果出现新字，要重新子集化**，
否则那个字会回退成系统字体。

```bash
python -m fontTools.subset 源字体.ttf --text-file=字符集.txt --flavor=woff2 \
  --output-file=assets/maple-regular.woff2 --layout-features='kern,liga'
```

字符集直接从 `index.html` 里提：

```python
import io
src = io.open('index.html', encoding='utf-8').read()
chars = set(src) | set(chr(c) for c in range(0x20, 0x7f))
io.open('chars.txt', 'w', encoding='utf-8').write(''.join(sorted(chars)))
```

## 上线

仓库名必须是 `zhoujinq.github.io`，Pages 才会伺服在根域名上。推 main 即可，Pages 自动构建。

## 两件已知的事

- 简历 PDF 目前是 **2 页**（目标是一页），需要再压。
- 「效果」段六个项目全是占位框，等截图补上。
