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
  assert.match(html, /\.hero-intro\{[^}]*font-family:"PingFang SC","Microsoft YaHei",sans-serif/);
  assert.match(html, /主页信息最近更新：2026-11-22/);
  assert.match(html, /<label class="ps" for="cmd">zjq : \/ \$<\/label>/);
  const terminal = between('<div class="tc-body" id="tcBody"', '</div>');
  assert.equal((terminal.match(/class="tc-line/g) || []).length, 0);
  assert.match(html, /\.tc-body:empty\{display:none\}/);
  assert.match(html, /commands\.about=function/);
  assert.match(html, /commands\.projects=function/);
  assert.match(html, /commands\.life=function/);
  const blocks = ['<header class="mast"', '<section id="projects">', '<section id="about">', '<section id="life">'];
  const positions = blocks.map(block => html.indexOf(block));
  positions.forEach(position => assert.notEqual(position, -1, '四大块必须完整保留'));
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]), '四大块顺序不能改变');
});

test('项目区只有两行：3 张主卡，第二行三组前卡后夹页', () => {
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

test('04～06 是小图卡，07～09 分别夹在对应卡片后面', () => {
  const secondary = between('<div class="grid secondary-grid">', '  </section>\n  <section id="about">');
  const subCards = secondary.match(/<article class="card secondary[\s\S]*?<\/article>/g) || [];
  const slips = secondary.match(/<article class="card folded[\s\S]*?<\/article>/g) || [];
  assert.equal(subCards.length, 3);
  assert.equal(slips.length, 3, '三张夹页必须和次卡处于同一网格，不能另起一行');
  for (const card of subCards) {
    assert.match(card, /<div class="media"><img src="assets\/shot-[a-z0-9]+\.webp"/, '次卡必须有图');
    assert.doesNotMatch(card, /f-sub/, '次卡不再加副标题');
  }
  assert.match(html, /\.card\.secondary \.media\{aspect-ratio:16\/8\}/, '次卡图片应明显小于主卡');
  assert.match(html, /\.folded \.media\{display:none\}/, '折叠页不直接展示截图');
  for (const [front, back, column] of [[4, 7, 1], [5, 8, 2], [6, 9, 3]]) {
    assert.match(html, new RegExp(`\\.card\\.secondary\\[data-id="p${front}"\\],\\s*\\.card\\.folded\\[data-id="p${back}"\\]\\{grid-column:${column};grid-row:1\\}`), `p${back} 应夹在 p${front} 后面`);
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
    assert.doesNotMatch(tpl, /ov-state|在线 ·|静态预览|虚构/, `tpl-p${i} 不应再有状态行`);
  }
  assert.doesNotMatch(html, /hajimi-ledger-demo/, '理财项目一律使用新仓库与新网址');
  assert.doesNotMatch(html, /记账投资助手/, '旧项目名应全部改为个人理财投资助手');
});

test('项目文案保持短、准，不写成长篇报告', () => {
  const overlays = between('<template id="tpl-p1">', '<script id="shell-engine">');
  for (const text of ['85 条配置 / 39 个模型', '6 家客户', '6.69 秒', '51 套真题', '19 个不可证伪的空话词']) {
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

test('关于我保留三段真实经历，不用业绩数字证明价值', () => {
  const about = between('<section id="about">', '<section id="life">');
  for (const text of [
    '东南大学通信工程本科',
    '联洲国际 TP-Link',
    '星尘智能 Astribot',
    '用 AI 做真正会用的工具'
  ]) assert.ok(about.includes(text), `关于我缺少：${text}`);
  assert.doesNotMatch(about, /307\s*万|300\s*万|8\s*台|10\s*台/);
});

test('Life 保留两张原图猫头鹰组件与三项热爱的顺序', () => {
  const life = between('<section id="life">', '<section id="dislikes">');
  assert.match(life, /assets\/duolingo-widget-clean\.webp/);
  assert.match(life, /assets\/momo-widget-clean\.webp/);
  assert.doesNotMatch(life, /brand-dot|北京时间每天|data-since|周一|周二|周三|周四|周五/);
  assert.match(life, /<b>多邻国<\/b>&nbsp;· 自高中起自选日语，CEFR B1水平/);
  assert.match(life, /<b>墨墨背单词<\/b>&nbsp;· 长期主义也藏在小事里/);
  assert.match(life, /<p class="likes-intro">喜欢学日语；常看量子位，也喜欢半佛仙人、赛博禅心、数字生命卡兹克/);
  assert.doesNotMatch(life, /不打卡给别人看/);
  const grid = between('<div class="life-grid">', '</section>');
  assert.equal((grid.match(/<div class="life"/g) || []).length, 3);
  const phrases = ['中单打野', '历史题材爽文', '陈奕迅'];
  const positions = phrases.map(text => grid.indexOf(text));
  positions.forEach((position, index) => assert.notEqual(position, -1, `缺少生活原文：${phrases[index]}`));
  assert.ok(positions[0] < positions[1] && positions[1] < positions[2], '三项热爱的顺序被改变');
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
  assert.match(footer, /<span class="ver">v2\.6\.0<\/span>/);
  assert.doesNotMatch(footer, /github\.com/, '页脚不再外链代码仓库');
});
