const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

function between(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1, `找不到区块起点：${start}`);
  const to = html.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `找不到区块终点：${end}`);
  return html.slice(from, to);
}

const SLUGS = ['customer-commitment-ledger', 'model-cutline', 'growing-assistant-skill'];


test('首屏保留像素名字与三行 80～100 字简介，终端默认不输出内容', () => {
  assert.match(html, /<title>周锦全的主页<\/title>/);
  assert.match(html, /class="logo"/);
  assert.match(html, /AI Native 时代的实践者、成长者、学徒/);
  const intro = between('<div class="hero-intro rise d4">', '</div>');
  assert.equal((intro.match(/<span>/g) || []).length, 3);
  const text = intro.replace(/<[^>]+>/g, '').replace(/\s/g, '');
  assert.ok(text.length >= 80 && text.length <= 100, `简介字数应为 80～100，当前为 ${text.length}`);
  assert.match(intro, /<span>用 AI 改造自己的工作/);
  assert.match(html, /\.hero-intro\{[^}]*font-family:var\(--mono\)/, '首屏三行简介必须使用用户指定的 Maple Mono 字体');
  assert.match(html, /\.sec-head h2\{[^}]*font-size:22px[^}]*text-transform:none;white-space:nowrap/, '章节标题应增大、不能强制全大写且不能拆开“项目”二字');
  assert.match(html, /<h2>Vibe Coding项目<\/h2>/);
  assert.match(html, /\.tc-prompt\{[^}]*min-height:64px/, '终端输入区应略微增高');
  assert.match(html, /id="cmd"[^>]*autofocus/i, '终端输入框应在首次进入时自动聚焦');
  assert.match(html, /input\.focus\(\{preventScroll:true\}\)/, '脚本应主动聚焦终端且不把页面拉回顶部');
  assert.match(html, /主页信息最近更新：2026-11-23/);
  assert.match(html, /<label class="ps" for="cmd">zjq : \/ \$<\/label>/);
  const terminal = between('<div class="tc-body" id="tcBody"', '</div>');
  assert.equal((terminal.match(/class="tc-line/g) || []).length, 0);
  assert.match(html, /\.tc-body:empty\{display:none\}/);
  assert.match(html, /commands\.about=function/);
  assert.match(html, /commands\.projects=function/);
  assert.match(html, /commands\.life=function/);
  const blocks = ['<header class="mast"', '<section id="projects">', '<section id="about">', '<footer>'];
  const positions = blocks.map(block => html.indexOf(block));
  positions.forEach(position => assert.notEqual(position, -1, '首屏、项目、关于我和页脚必须完整保留'));
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]), '页面主体只能是项目与关于我两大块');
  assert.doesNotMatch(html, /<section id="life">/, '生活不再独立成区，应并入关于我');
  const nav = between('<nav class="nav-block rise d6" aria-label="页面导航">', '</nav>');
  assert.equal((nav.match(/<a /g) || []).length, 2, '导航只保留项目与关于我');
  assert.ok(nav.includes('>项目</a>') && nav.includes('>关于我</a>'));
  assert.doesNotMatch(nav, />生活<\/a>/);
});

test('项目区只有两行：3 张主卡，第二行三组上小卡下夹页', () => {
  assert.equal((html.match(/<article class="card" data-id="p\d"/g) || []).length, 3);
  assert.equal((html.match(/<article class="card secondary" data-id="p\d"/g) || []).length, 3);
  assert.equal((html.match(/<article class="card folded" data-id="p\d"/g) || []).length, 3);
  assert.doesNotMatch(html, /<details class="project-book"/, '项目书应已删除');
  assert.doesNotMatch(html, /class="shelf"|class="folder-grid"|还有 3 个 · 折起来放着/, '不能另起第三行');
  const order = ['销售助手 · 客户管理系统', 'AI 模型斩杀线', 'Personal AI · 会成长的个人助手',
    'API 商机雷达', '个人理财投资助手', '日语 N1 备考教练', '破万卷', '外卖吃啥', '简历工坊 Pro'];
  order.forEach((name, i) => {
    assert.ok(html.includes(`data-id="p${i + 1}" data-name="${name}"`), `第 ${i + 1} 个项目应为 ${name}`);
  });
  assert.match(html, /9 个项目 · 都能点开/);
  assert.doesNotMatch(html, /<span class="dot"><\/span>在线/, '卡片不再标在线状态');
  assert.doesNotMatch(html, /虚构快照|数字全虚构/, '不再出现虚构快照类状态文字');
});

test('04～06 进一步缩小并微倾斜，07～09 分别夹在对应卡片下方', () => {
  const secondary = between('<div class="grid secondary-grid">', '  </section>\n  <section id="about">');
  const subCards = secondary.match(/<article class="card secondary[\s\S]*?<\/article>/g) || [];
  const slips = secondary.match(/<article class="card folded[\s\S]*?<\/article>/g) || [];
  assert.equal(subCards.length, 3);
  assert.equal(slips.length, 3, '三张夹页必须和次卡处于同一网格，不能另起一行');
  for (const card of subCards) {
    assert.match(card, /<div class="media"><img src="assets\/shot-[a-z0-9]+\.webp"/, '次卡必须有图');
    assert.doesNotMatch(card, /f-sub/, '次卡不再加副标题');
  }
  assert.match(html, /\.card\.secondary \.media\{aspect-ratio:16\/7\}/, '次卡图片应进一步压低并明显小于主卡');
  assert.match(html, /\.card\.secondary\{[^}]*width:calc\(100% - 24px\)[^}]*transform:rotate\(var\(--tilt\)\) scale\(\.90\)/, '04～06 要比上一版更小并保持微倾斜');
  assert.match(html, /\.card\.folded\.in\{transform:translateY\(62px\)\}/, '07～09 要贴在 04～06 下沿');
  assert.match(html, /\.folded \.media\{display:none\}/, '折叠页不直接展示截图');
  assert.match(html, /\.card\.folded\[data-id="p9"\]\{[^}]*width:82%[^}]*height:58px/, '09 夹页应收窄到接近 06 并略微缩短');
  assert.match(html, /\.card\.folded\[data-id="p9"\]\.in\{transform:translateY\(62px\) rotate\(-1\.8deg\)\}/, '09 夹页应比其余夹页有更明显的倾角');
  for (const [front, back, column] of [[4, 7, 1], [5, 8, 2], [6, 9, 3]]) {
    assert.match(html, new RegExp(`\\.card\\.secondary\\[data-id="p${front}"\\],\\s*\\.card\\.folded\\[data-id="p${back}"\\]\\{grid-column:${column};grid-row:1\\}`), `p${back} 与 p${front} 必须同组`);
    assert.ok(secondary.indexOf(`data-id="p${front}"`) < secondary.indexOf(`data-id="p${back}"`), `p${back} 应位于 p${front} 下方`);
  }
  for (const slip of slips) {
    assert.match(slip, /<div class="media"><img src="assets\/shot-[a-z0-9]+\.webp"/, '折叠页仍要自带截图供详情使用');
    assert.match(slip, /<span class="f-sub">[^<]{6,}<\/span>/, '折叠页必须有一行小字副标题');
    assert.match(slip, /aria-label="打开 /);
  }
});

test('九个项目只贴一条原始网址，不放按钮也不放仓库', () => {
  const sites = [
    'https://zhoujinq.github.io/customer-commitment-ledger/',
    'https://zhoujinq.github.io/model-cutline/',
    'https://zhoujinq.github.io/growing-assistant-skill/',
    'https://zhoujinq.github.io/api-opportunity-radar/',
    'https://zhoujinq.github.io/personal-finance-assistant/',
    'https://zhoujinq.github.io/n1-study-dashboard/',
    'https://zhoujinq.github.io/po-wan-juan/',
    'https://zhoujinq.github.io/what-to-eat/',
    'https://zhoujinq.github.io/resume-master/'
  ];
  assert.equal((html.match(/class="ov-links"/g) || []).length, 9);
  for (let i = 1; i <= 9; i += 1) {
    const tpl = between(`<template id="tpl-p${i}">`, '</template>');
    const site = sites[i - 1];
    assert.ok(tpl.includes(`<a href="${site}" target="_blank" rel="noopener">${site}</a>`), `tpl-p${i} 应直接贴出原始网址`);
    assert.equal((tpl.match(/target="_blank" rel="noopener">/g) || []).length, 1, `tpl-p${i} 只应有一个外链`);
    assert.doesNotMatch(tpl, /github\.com|打开网站|公开网站|代码仓库/, `tpl-p${i} 不应再放按钮或仓库`);
    assert.doesNotMatch(tpl, /ov-state|在线 ·|静态预览/, `tpl-p${i} 不应再有状态行`);
  }
  assert.doesNotMatch(html, /hajimi-ledger-demo/, '理财项目一律使用新仓库与新网址');
  assert.doesNotMatch(html, /记账投资助手/, '旧项目名应全部改为个人理财投资助手');
});

test('项目文案保持短、准，不写成长篇报告', () => {
  const overlays = between('<template id="tpl-p1">', '<script id="shell-engine">');
  for (const text of ['85 条配置 / 39 个模型', '辅助触达 80 家客户', '约 130 条跟进', '均为虚构演示数据', '6 家客户', '6.69 秒', '51 套真题', '19 个不可证伪的空话词']) {
    assert.ok(overlays.includes(text), `覆盖层缺少口径：${text}`);
  }
  for (const stale of ['70 条配置', '34 个模型', '九项门禁', '为什么做', '打开网站']) {
    assert.ok(!overlays.includes(stale), `仍在沿用旧内容：${stale}`);
  }
  const plain = overlays.replace(/<[^>]+>/g, '').replace(/\s/g, '');
  assert.ok(plain.length < 2400, `九份详情合计 ${plain.length} 字，仍然太长`);
  for (let i = 4; i <= 9; i += 1) {
    const tpl = between(`<template id="tpl-p${i}">`, '</template>');
    const len = tpl.replace(/<[^>]+>/g, '').replace(/\s/g, '').length;
    assert.ok(len < 300, `tpl-p${i} 详情 ${len} 字，应当比主卡更短`);
  }
});

test('关于我保持指定顺序，履历与三个喜恶标题均为明显的默认折叠层', () => {
  const about = between('<section id="about">', '  </main>');
  const intro = '我是周锦全，2021入学东南大学通信工程本科，做过自动驾驶算法、医美整容预测cv算法和毫米波芯片。在联洲国际tplink做过国际业务管培生卖路由器（大客户方向），现在在星尘智能Astribot做海外大科研销售卖机器人。工作之外，我会用 AI 来Vibe Coding一些满足我好奇心的小玩意。努力追求身心健康、努力跟上AI Native';
  assert.ok(about.includes(`<p class="about-brief">${intro}</p>`), '自我介绍必须使用用户指定原文');
  const order = ['class="about-brief"', 'class="streak-grid"', 'class="life-grid"', 'class="journey-fold"', 'class="life-goal about-goal"', 'id="beliefs"', 'id="likes"', 'id="dislikes"'];
  const positions = order.map(marker => about.indexOf(marker));
  positions.forEach((position, index) => assert.notEqual(position, -1, `关于我缺少：${order[index]}`));
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]), '关于我必须按简介、打卡、三项热爱、履历、目标信念、信念清单、喜欢、讨厌排序');
  assert.match(about, /<details class="journey-fold" id="journey">/, '履历与工作必须默认折叠');
  assert.doesNotMatch(about, /<details class="journey-fold" id="journey" open>/);
  assert.ok(about.includes('<span>履历与工作</span>'));
  for (const id of ['beliefs', 'likes', 'dislikes']) {
    assert.match(about, new RegExp(`<details class="about-fold" id="${id}">`), `${id} 必须默认折叠`);
    assert.doesNotMatch(about, new RegExp(`<details class="about-fold" id="${id}" open>`));
  }
  assert.equal((about.match(/class="fold-closed"/g) || []).length, 4, '四个折叠层都要明确写出已折叠与点击展开');
  assert.equal((about.match(/class="fold-open"/g) || []).length, 4, '四个折叠层展开后都要允许点击收起');
  assert.match(html, /\.journey-fold>summary::before,\.about-fold>summary::before\{[^}]*font-size:22px/, '折叠三角必须明显增大');
  assert.match(html, /\.journey-fold:not\(\[open\]\),\.about-fold:not\(\[open\]\)\{[^}]*background:#eadcc3/, '折叠态使用与 09 夹页同族的暖纸底色');
  assert.match(html, /\.journey-fold\[open\],\.about-fold\[open\]\{background:transparent\}/, '展开后应退掉折叠底色');
  assert.ok(about.includes('<div class="about-compact">') && about.includes('<div class="about-daily">') && about.includes('<div class="about-notes">'), '关于我应使用日常与思考双栏结构');
  assert.match(html, /@media\(min-width:960px\)\{[\s\S]*?\.about-compact\{display:grid;grid-template-columns:minmax\(0,\.92fr\) minmax\(0,1\.08fr\);gap:22px;margin-top:18px;align-items:start\}/, '桌面双栏应在真实媒体查询中生效');
  assert.match(html, /@media\(min-width:960px\)\{[\s\S]*?#about \.life-visual\{height:54px;margin-bottom:8px\}/, '桌面热爱图片应明显缩小');
  assert.match(html, /@media\(min-width:960px\)\{[\s\S]*?#about \.streak-grid\{margin:0;gap:12px\}/, '桌面打卡图片组应压缩留白');
  assert.doesNotMatch(about, /完整版 About|完整版About|详细履历与工作/);
  assert.ok(about.includes('<p class="goal-lead">我的人生目标是探索热爱和美好。</p>'));
  assert.ok(about.includes('我的信念：人生的追求不应该是牛逼，而应该是幸福。'));
  assert.equal((about.match(/class="goal-aside"/g) || []).length, 2, '日期引文与两段补充说明都要保持小字');
  assert.ok(about.includes('<p class="goal-aside">写于2026-11-22周六，AI对黎曼猜想的证明通过Lean形式化验证：<br>虽然AI能证出黎曼猜想，但是AI享受不了吃喝玩乐也体验不到欢喜悲愁，AI击碎了人类的优越感，但人类拥有的东西仍然有很多。</p>'), '新增日期引文必须使用用户指定原文');
  assert.ok(about.includes('<p class="goal-aside">在 AI 焦虑的时代，认知行为疗法是必要的。我们要改的可能不是行为，而是认知本身。</p>'));
  assert.doesNotMatch(about, /亲密关系、职业能力和投资能力|十年后，我希望|如果只能留下一个代表作|穷则独善其身|知道自己不知道|集中力量办大事|生活不是只有延迟满足/);
});

test('打卡、三项热爱、六条信念与喜恶全部使用指定原文', () => {
  const about = between('<section id="about">', '  </main>');
  assert.match(about, /assets\/duolingo-widget-clean\.webp/);
  assert.match(about, /assets\/momo-widget-clean\.webp/);
  assert.doesNotMatch(about, /brand-dot|北京时间每天|data-since|周一|周二|周三|周四|周五/);
  assert.match(about, /<b>多邻国<\/b>&nbsp;· 自高中起自选日语，CEFR B1水平/);
  assert.match(about, /<b>墨墨背单词<\/b>&nbsp;· 长期主义也藏在小事里/);
  const grid = between('<div class="life-grid">', '  <details class="journey-fold"');
  assert.equal((grid.match(/<div class="life"/g) || []).length, 3);
  const hobbies = ['喜欢打王者荣耀，11年老玩家，擅长中单打野。', '喜欢看历史题材爽文，是我很具体的放松方式。', '有些歌不是用来提升品味，只是刚好陪过自己，强推《富士山下》。'];
  const hobbyPositions = hobbies.map(text => grid.indexOf(text));
  hobbyPositions.forEach((position, index) => assert.notEqual(position, -1, `缺少热爱原文：${hobbies[index]}`));
  assert.ok(hobbyPositions[0] < hobbyPositions[1] && hobbyPositions[1] < hobbyPositions[2], '三项热爱的顺序被改变');
  const beliefs = between('<ol class="belief-list">', '</ol>');
  assert.equal((beliefs.match(/<li>/g) || []).length, 6);
  assert.doesNotMatch(beliefs, /<p>|<strong>/, '六条信念只保留主标题，不附解释');
  for (const text of ['弱小和无知不是生存的障碍，傲慢才是。', '相信二八定律，尊重边际递减效应。', '人生得意须尽欢，莫使金樽空对月。', '想做了就去做，知而不行，只是未知。', '多做酷而难的事情，少做平庸而容易的事情。', '我是积极的AI降临派，少焦虑，少因AI焦虑。']) assert.ok(beliefs.includes(`<li>${text}</li>`), `信念原文被改动：${text}`);
  assert.match(html, /\.belief-list\{display:grid;grid-template-columns:1fr;/, '六条信念必须单列');
  for (const text of ['喜欢学日语；', '喜欢看公众号，喜欢量子位，也喜欢半佛仙人、赛博禅心、数字生命卡兹克；', '爱打游戏， S16英雄联盟世界冠军BLG牛逼！', '喜欢看日本少年漫；', '喜欢看番茄小说的爽文。喜欢吃橘子，尤其是金钱橘。', '喜欢凡事优先问大模型，喜欢大肥鱼DeepSeek；', '喜欢的作家有马伯庸、当年明月，也听莫扎特和德彪西。']) assert.ok(about.includes(`<li>${text}</li>`), `喜欢清单原文被改动：${text}`);
  assert.ok(about.includes('<h2>我相信的一些东西</h2>'));
  assert.ok(about.includes('<h2>我喜欢的一些东西</h2>'));
  assert.ok(about.includes('<h2>我讨厌的一些东西</h2>'));
  assert.ok(about.includes('明明可以用自动化，却偏要人反复做。'));
  assert.ok(about.includes('高度压力、疲惫状态下的情绪代偿失败。'));
});

test('页面保持零框架、零 CDN、零外部资源请求', () => {
  assert.doesNotMatch(html, /<(?:script|img)\b[^>]*\bsrc="https?:/i);
  assert.doesNotMatch(html, /url\(\s*["']?https?:/i);
  assert.doesNotMatch(html, /<link\b[^>]*\bhref="https?:/i);
});

test('项目覆盖层的无障碍标题在每次渲染时重新关联', () => {
  assert.match(html, /aria-labelledby="ovName"/);
  assert.match(html, /name\.id = "ovName"/);
});

test('页脚只保留版权、版本和回顶，版本与本次发布一致', () => {
  const footer = between('<footer>', '</footer>');
  assert.doesNotMatch(footer, /这个页面|@mac|纯静态|无追踪/);
  assert.doesNotMatch(html, /这个页面\s*纯静态|id="contact"|class="contact-panel"|data-copy/);
  assert.match(html, /<header[\s\S]*?2336097716@qq\.com[\s\S]*?github\.com\/zhoujinq[\s\S]*?<\/header>/);
  assert.match(footer, /<span class="ver">v3\.1\.0<\/span>/);
  assert.doesNotMatch(footer, /github\.com/, '页脚不再外链代码仓库');
});

test('首屏三张项目图立即请求，卡片不依赖滚动脚本才能显示', () => {
  for (const asset of ['shot-sales.svg', 'shot-cutline.svg', 'shot-growing.svg']) {
    assert.match(html, new RegExp(`<link rel="preload" href="assets/${asset}" as="image" fetchpriority="high">`), `${asset} 应在头部预加载`);
  }
  const featured = between('<div class="grid featured-grid">', '<div class="grid secondary-grid">');
  for (const id of ['p1', 'p2', 'p3']) {
    const card = between(`<article class="card" data-id="${id}"`, '</article>');
    assert.match(card, /loading="eager"/, `${id} 不应懒加载`);
    assert.match(card, /decoding="sync"/, `${id} 不应异步推迟解码`);
    assert.match(card, /fetchpriority="high"/, `${id} 应提高请求优先级`);
  }
  assert.match(html, /\.card\{[^}]*opacity:1;transform:translateY\(16px\)/, '卡片默认必须可见，滚动入场只保留位移');
});

test('生活区王者图标不再用超大原图争抢冷启动带宽', () => {
  const size = fs.statSync(path.join(__dirname, '..', 'assets', 'life-honor-app.jpg')).size;
  assert.ok(size < 32768, `王者图标应压缩到 32 KB 内，当前 ${size} 字节`);
  assert.match(html, /src="assets\/life-honor-app\.jpg"[^>]*width="104" height="104"/);
});
