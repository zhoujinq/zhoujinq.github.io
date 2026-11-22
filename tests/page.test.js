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

const SLUGS = [
  'customer-commitment-ledger',
  'n1-study-dashboard',
  'hajimi-ledger-demo',
  'growing-assistant-skill',
  'resume-master',
  'what-to-eat',
  'model-cutline',
  'po-wan-juan',
  'api-opportunity-radar'
];

test('首屏保留像素名字与三行 80～100 字简介，终端默认不输出内容', () => {
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

test('项目共 9 个：前 3 个常展、后 6 个在项目书里，全部在线', () => {
  assert.equal((html.match(/<article class="card" data-id="p\d"/g) || []).length, 9);
  const featured = between('<div class="grid featured-grid">', '<details class="project-book">');
  assert.equal((featured.match(/<article class="card"/g) || []).length, 3);
  const book = between('<details class="project-book">', '<section id="about">');
  assert.equal((book.match(/<article class="card"/g) || []).length, 6);

  for (const name of ['销售助手', 'N1 备考教练', '记账投资助手', 'Personal AI', '简历工坊 Pro', '外卖吃啥', '模型斩杀线', '破万卷', 'API 商机雷达']) {
    assert.match(html, new RegExp(`data-name="[^"]*${name}`), `项目列表缺少：${name}`);
  }
  assert.doesNotMatch(html, /class="card planned"|规划占位|规划中|第九个待定|预览待补/);
  assert.match(html, /9 \/ 9 已上线/);
  assert.equal((html.match(/<span class="dot"><\/span>在线/g) || []).length, 9, '九张卡片都应标注在线');
});

test('九张卡片的覆盖层都给出可点击的公开网站与代码仓库', () => {
  for (const slug of SLUGS) {
    const site = `https://zhoujinq.github.io/${slug}/`;
    const repo = `https://github.com/zhoujinq/${slug}`;
    assert.ok(html.includes(site), `缺少公开网站：${site}`);
    assert.ok(html.includes(repo), `缺少代码仓库：${repo}`);
  }
  for (let i = 1; i <= 9; i += 1) {
    const tpl = between(`<template id="tpl-p${i}">`, '</template>');
    assert.match(tpl, /class="ov-links"/, `tpl-p${i} 缺少链接区`);
    assert.equal((tpl.match(/target="_blank" rel="noopener">/g) || []).length, 2, `tpl-p${i} 应有两个外链`);
  }
  assert.equal((html.match(/class="ov-links"/g) || []).length, 9);
  assert.doesNotMatch(html, /href="https:\/\/zhoujinq\.github\.io\/"\s/, '不要退回个人主页地址');
});

test('项目文案与各项目最新状态一致，不沿用旧口径', () => {
  const overlays = between('<template id="tpl-p1">', '<script id="shell-engine">');
  for (const text of [
    '85 条配置 / 39 个模型',
    '51 套真题',
    '6 家客户',
    '3 张商机卡',
    'v0.5.0',
    'v1.1.0',
    'v1.4.3',
    'MVP 0.1.0'
  ]) assert.ok(overlays.includes(text), `覆盖层缺少最新口径：${text}`);
  for (const stale of ['70 条配置', '34 个模型', '九项门禁', '详细内容等整理好后补充', '项目位已保留']) {
    assert.ok(!overlays.includes(stale), `仍在沿用旧数据：${stale}`);
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
  assert.match(footer, /releases\/tag\/v2\.2\.0/);
  assert.match(footer, />v2\.2\.0<\/a>/);
});
