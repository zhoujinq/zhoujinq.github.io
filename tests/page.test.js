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

const SLUGS = ['customer-commitment-ledger', 'n1-study-dashboard', 'hajimi-ledger-demo'];


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

test('项目只展示 3 个，全部在线，不再有项目书和长列表', () => {
  assert.equal((html.match(/<article class="card" data-id="p\d"/g) || []).length, 3);
  assert.doesNotMatch(html, /<details class="project-book"/, '项目书应已删除，避免一次堆九个项目');
  for (const name of ['销售助手', '模型斩杀线', 'Personal AI']) {
    assert.match(html, new RegExp(`data-name="[^"]*${name}`), `项目列表缺少：${name}`);
  }
  for (const gone of ['日语 N1', '记账投资助手', '简历工坊 Pro', '外卖吃啥', '破万卷', 'API 商机雷达']) {
    assert.doesNotMatch(html, new RegExp(`data-name="[^"]*${gone}`), `首页不该再列：${gone}`);
  }
  assert.match(html, /3 个项目 · 都能点开/);
  assert.equal((html.match(/<span class="dot"><\/span>在线/g) || []).length, 3, '三张卡片都应标注在线');
});

test('每个项目只给一个可看的网站链接，不暴露代码仓库', () => {
  const sites = [
    'https://zhoujinq.github.io/customer-commitment-ledger/',
    'https://zhoujinq.github.io/model-cutline/',
    'https://zhoujinq.github.io/growing-assistant-skill/'
  ];
  for (const site of sites) assert.ok(html.includes(site), `缺少公开网站：${site}`);
  assert.doesNotMatch(html, /https:\/\/github\.com\/zhoujinq\/(customer-commitment-ledger|model-cutline|growing-assistant-skill)/, '项目区不应再放代码仓库');
  for (let i = 1; i <= 3; i += 1) {
    const tpl = between(`<template id="tpl-p${i}">`, '</template>');
    assert.match(tpl, /class="ov-links"/, `tpl-p${i} 缺少链接区`);
    assert.equal((tpl.match(/target="_blank" rel="noopener">/g) || []).length, 1, `tpl-p${i} 只应有一个外链`);
    assert.doesNotMatch(tpl, /github\.com/, `tpl-p${i} 不应出现仓库地址`);
  }
  assert.equal((html.match(/class="ov-links"/g) || []).length, 3);
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
  assert.ok(plain.length < 900, `三份详情合计 ${plain.length} 字，仍然太长`);
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
  assert.match(footer, /<span class="ver">v2\.3\.1<\/span>/);
  assert.doesNotMatch(footer, /github\.com/, '页脚不再外链代码仓库');
});
