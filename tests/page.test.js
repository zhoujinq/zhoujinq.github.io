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

test('首屏保留像素名字与三行 80～100 字简介，终端默认不输出内容', () => {
  assert.match(html, /class="logo"/);
  assert.match(html, /AI Native 时代的实践者、成长者、学徒/);
  const intro = between('<div class="hero-intro rise d4">', '</div>');
  assert.equal((intro.match(/<span>/g) || []).length, 3);
  const text = intro.replace(/<[^>]+>/g, '').replace(/\s/g, '');
  assert.ok(text.length >= 80 && text.length <= 100, `简介字数应为 80～100，当前为 ${text.length}`);
  assert.match(html, /最近更新：2026-11-20/);
  assert.match(html, /这好像是个终端，输入 <b>about<\/b> \/ <b>projects<\/b> \/ <b>life<\/b>，回车看看/);
  assert.match(html, /<label class="ps" for="cmd">zjq : \/ \$<\/label>/);
  const terminal = between('<div class="tc-body" id="tcBody"', '</div>');
  assert.equal((terminal.match(/class="tc-line/g) || []).length, 0);
  assert.match(html, /\.tc-body:empty\{display:none\}/);
  assert.match(html, /commands\.about=function/);
  assert.match(html, /commands\.projects=function/);
  assert.match(html, /commands\.life=function/);
});

test('终端去掉旧标题和 mac 字样，宽度跟随整页内容', () => {
  assert.doesNotMatch(html, /zhoujinq\s*—\s*-zsh|80×24|zhoujinq@mac|@mac|macOS/);
  assert.match(html, /\.term-card\{[^}]*width:100%;max-width:none/);
  assert.match(html, /form\.querySelector\("\.ps"\)\.textContent = shell\.prompt\(\)/);
});

test('项目共 9 个：前 3 个常展，后 6 个书页式折叠，规划项不伪装完成', () => {
  assert.equal((html.match(/<article class="card(?: planned)?"/g) || []).length, 9);
  const featured = between('<div class="grid">', '</div>\n    <details class="project-book">');
  assert.equal((featured.match(/<article class="card"/g) || []).length, 3);
  const folded = between('<details class="project-book">', '</details>');
  assert.equal((folded.match(/<article class="card(?: planned)?"/g) || []).length, 6);
  assert.match(folded, /翻开其余 6 个项目/);
  assert.match(folded, /data-name="破万卷"/);
  assert.match(folded, /data-name="第九个待定"/);
  assert.equal((folded.match(/规划占位/g) || []).length, 2);
  assert.match(html, /id="tpl-p8"/);
  assert.match(html, /id="tpl-p9"/);
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

test('Life 使用两张原图猫头鹰组件，删除圆点、星期和自动加一说明', () => {
  const life = between('<section id="life">', '</section>');
  assert.match(life, /assets\/duolingo-widget\.jpg" alt="多邻国 2D 小组件与猫头鹰角色"/);
  assert.match(life, /assets\/momo-widget\.jpg" alt="墨墨背单词 2D 小组件与猫头鹰角色"/);
  assert.doesNotMatch(life, /brand-dot|北京时间每天|data-since|周一|周二|周三|周四|周五/);
  assert.match(life, /<h2>性格、生活<\/h2>/);
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

test('页脚只保留版权、版本和回顶，版本与本次发布一致', () => {
  const footer = between('<footer>', '</footer>');
  assert.doesNotMatch(footer, /这个页面|@mac|纯静态|无追踪/);
  assert.doesNotMatch(html, /这个页面\s*纯静态/);
  assert.match(footer, /releases\/tag\/v1\.5\.0/);
  assert.match(footer, />v1\.5\.0<\/a>/);
});
