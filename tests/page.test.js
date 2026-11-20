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

test('首屏保留像素名字、macOS 终端，默认只有一行信息输出', () => {
  assert.match(html, /class="logo"/);
  assert.match(html, /zhoujinq — -zsh — 80×24/);
  assert.match(html, /AI Native 时代的实践者、成长者、学徒/);
  const terminal = between('<div class="tc-body" id="tcBody"', '</div>\n      <form');
  assert.equal((terminal.match(/class="tc-line out"/g) || []).length, 1);
  for (const command of ['about', 'projects', 'life']) {
    assert.match(html, new RegExp(`${command}: \\{`));
  }
});

test('关于我保留指定真实经历，不用业绩数字证明价值', () => {
  const about = between('<details class="fold" id="about">', '</details>');
  for (const text of [
    '东南大学通信工程毕业',
    '联洲tplink海外技术型销售',
    '星尘智能海外大科研销售经理',
    '开始用 AI 改造自己的工作'
  ]) assert.ok(about.includes(text), `关于我缺少：${text}`);
  assert.doesNotMatch(about, /307\s*万|300\s*万|8\s*台|10\s*台/);
});

test('Life 使用两张原图猫头鹰组件，三项热爱保持指定顺序和原文', () => {
  const life = between('<section id="life">', '</section>');
  assert.match(life, /assets\/duolingo-widget\.jpg" alt="多邻国 2D 小组件与猫头鹰角色"/);
  assert.match(life, /assets\/momo-widget\.jpg" alt="墨墨背单词 2D 小组件与猫头鹰角色"/);
  const grid = between('<div class="life-grid">', '</div>\n\n    <details');
  assert.equal((grid.match(/<div class="life">/g) || []).length, 3);
  const phrases = [
    '喜欢打王者荣耀，擅长中单打野。',
    '喜欢看爽文，偏好番茄小说app的历史题材作品。',
    '喜欢的歌手是陈奕迅。'
  ];
  const positions = phrases.map(text => life.indexOf(text));
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

test('页脚版本与本次发布一致', () => {
  assert.match(html, /releases\/tag\/v1\.4\.0/);
  assert.match(html, />v1\.4\.0<\/a>/);
});
