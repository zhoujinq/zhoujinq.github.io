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

test('项目区是 3 张主卡加 6 页折起来的项目，不再有项目书', () => {
  assert.equal((html.match(/<article class="card" data-id="p\d"/g) || []).length, 3);
  assert.equal((html.match(/<article class="card folded (back|front)" data-id="p\d"/g) || []).length, 6);
  assert.equal((html.match(/<div class="folder">/g) || []).length, 3, '六个项目折成三个文件夹');
  assert.doesNotMatch(html, /<details class="project-book"/, '项目书应已删除');
  for (const name of ['销售助手', '模型斩杀线', 'Personal AI']) {
    assert.match(html, new RegExp(`data-name="[^"]*${name}`), `主推项目缺少：${name}`);
  }
  for (const name of ['日语 N1 备考教练', '记账投资助手', '简历工坊 Pro', '外卖吃啥', '破万卷', 'API 商机雷达']) {
    const hits = html.match(new RegExp(`class="card folded [^"]*" data-id="p\\d" data-name="${name}"`));
    assert.ok(hits, `折叠页缺少：${name}`);
  }
  assert.match(html, /3 个主推 · 6 个折起来/);
  assert.match(html, /另外 6 个 · 折起来放着/);
  assert.equal((html.match(/<span class="dot"><\/span>在线/g) || []).length, 3, '三张主卡都应标注在线');
});

test('折叠页只露名字，截图收在卡片里，点开仍能看详情', () => {
  assert.match(html, /\.folded \.media\{display:none\}/, '折叠页不应直接展示截图');
  const shelf = between('<div class="shelf">', '<section id="about">');
  const foldedCards = shelf.match(/<article class="card folded[\s\S]*?<\/article>/g) || [];
  assert.equal(foldedCards.length, 6);
  for (const card of foldedCards) {
    assert.match(card, /<div class="media"><img src="assets\/shot-[a-z0-9]+\.webp"/, '每张折叠卡都要带自己的截图');
    assert.match(card, /aria-label="打开 /);
    assert.match(card, /class="f-no">0[4-9]</);
  }
  assert.match(html, /\.card\.folded\.back\{position:absolute/);
  assert.match(html, /@media \(prefers-reduced-motion:reduce\)/);
});

test('九个项目都只给一个可看的网站链接，不暴露代码仓库', () => {
  const sites = [
    'https://zhoujinq.github.io/customer-commitment-ledger/',
    'https://zhoujinq.github.io/model-cutline/',
    'https://zhoujinq.github.io/growing-assistant-skill/',
    'https://zhoujinq.github.io/resume-master/',
    'https://zhoujinq.github.io/n1-study-dashboard/',
    'https://zhoujinq.github.io/hajimi-ledger-demo/',
    'https://zhoujinq.github.io/what-to-eat/',
    'https://zhoujinq.github.io/po-wan-juan/',
    'https://zhoujinq.github.io/api-opportunity-radar/'
  ];
  for (const site of sites) assert.ok(html.includes(site), `缺少公开网站：${site}`);
  for (let i = 1; i <= 9; i += 1) {
    const tpl = between(`<template id="tpl-p${i}">`, '</template>');
    assert.match(tpl, /class="ov-links"/, `tpl-p${i} 缺少链接区`);
    assert.equal((tpl.match(/target="_blank" rel="noopener">/g) || []).length, 1, `tpl-p${i} 只应有一个外链`);
    assert.doesNotMatch(tpl, /github\.com/, `tpl-p${i} 不应出现仓库地址`);
  }
  assert.equal((html.match(/class="ov-links"/g) || []).length, 9);
  assert.doesNotMatch(html, /href="https:\/\/zhoujinq\.github\.io\/"\s/, '不要退回个人主页地址');
});

test('项目文案保持短、准，不写成长篇报告', () => {
  const overlays = between('<template id="tpl-p1">', '<script id="shell-engine">');
  for (const text of [
    '85 条配置 / 39 个模型',
    '6 家客户',
    '6.69 秒',
    'v0.1.0',
    '虚构快照'
  ]) assert.ok(overlays.includes(text), `覆盖层缺少最新口径：${text}`);
  for (const stale of ['70 条配置', '34 个模型', '九项门禁', '详细内容等整理好后补充', '项目位已保留', '为什么做']) {
    assert.ok(!overlays.includes(stale), `仍在沿用旧内容：${stale}`);
  }
  const plain = overlays.replace(/<[^>]+>/g, '').replace(/\s/g, '');
  assert.ok(plain.length < 1800, `九份详情合计 ${plain.length} 字，仍然太长`);
  for (let i = 4; i <= 9; i += 1) {
    const tpl = between(`<template id="tpl-p${i}">`, '</template>');
    const len = tpl.replace(/<[^>]+>/g, '').replace(/\s/g, '').length;
    assert.ok(len < 240, `折叠项目 tpl-p${i} 详情 ${len} 字，应当比主卡更短`);
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
  assert.match(footer, /<span class="ver">v2\.4\.0<\/span>/);
  assert.doesNotMatch(footer, /github\.com/, '页脚不再外链代码仓库');
});
