const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadStreak() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const match = html.match(/<script id="streak-engine">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html 应包含可独立测试的 streak-engine 脚本');
  const module = { exports: {} };
  new Function('module', 'exports', match[1])(module, module.exports);
  return module.exports;
}

test('11 月 20 日基准值与截图一致', () => {
  const streak = loadStreak();
  const now = new Date('2026-11-20T08:00:00.000Z');
  assert.equal(streak.daysAt({ days: 1920, base: '2026-11-20' }, now), 1920);
  assert.equal(streak.daysAt({ days: 1493, base: '2026-11-20' }, now), 1493);
});

test('北京时间 23:59:59 不增加，次日 00:00 立即增加', () => {
  const streak = loadStreak();
  const duo = { days: 1920, base: '2026-11-20' };
  const momo = { days: 1493, base: '2026-11-20' };
  assert.equal(streak.daysAt(duo, new Date('2026-11-20T15:59:59.999Z')), 1920);
  assert.equal(streak.daysAt(momo, new Date('2026-11-20T15:59:59.999Z')), 1493);
  assert.equal(streak.daysAt(duo, new Date('2026-11-20T16:00:00.000Z')), 1921);
  assert.equal(streak.daysAt(momo, new Date('2026-11-20T16:00:00.000Z')), 1494);
});

test('跨自然日累计增加，早于基准日不倒扣', () => {
  const streak = loadStreak();
  const cfg = { days: 1920, base: '2026-11-20' };
  assert.equal(streak.daysAt(cfg, new Date('2026-11-25T08:00:00.000Z')), 1925);
  assert.equal(streak.daysAt(cfg, new Date('2026-11-19T16:00:00.000Z')), 1920);
});

test('不受访问者设备时区影响', () => {
  const streak = loadStreak();
  const cfg = { days: 1920, base: '2026-11-20' };
  const instant = new Date('2026-11-20T16:00:00.000Z');
  assert.equal(streak.daysAt(cfg, instant, 'Pacific/Honolulu'), 1921);
  assert.equal(streak.daysAt(cfg, instant, 'Asia/Shanghai'), 1921);
});

test('计算距离下一次北京时间零点的毫秒数', () => {
  const streak = loadStreak();
  assert.equal(streak.msToNextMidnight(new Date('2026-11-20T15:59:59.500Z')), 500);
  assert.equal(streak.msToNextMidnight(new Date('2026-11-20T16:00:00.000Z')), 86400000);
});

test('拒绝无效配置，避免页面静默显示错误数字', () => {
  const streak = loadStreak();
  assert.throws(() => streak.daysAt({ days: null, base: '2026-11-20' }, new Date()), /days/);
  assert.throws(() => streak.daysAt({ days: 1920, base: '20/11/2026' }, new Date()), /base/);
});
