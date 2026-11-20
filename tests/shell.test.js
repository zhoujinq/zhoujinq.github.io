const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function createShell() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const match = html.match(/<script id="shell-engine">([\s\S]*?)<\/script>/);
  assert.ok(match, 'index.html 应包含可独立测试的 shell-engine 脚本');
  const module = { exports: {} };
  new Function('module', 'exports', match[1])(module, module.exports);
  return module.exports.create();
}

function ok(shell, input) {
  const result = shell.execute(input);
  assert.equal(result.ok, true, `${input} 应执行成功：${result.text}`);
  return result;
}

function bad(shell, input) {
  const result = shell.execute(input);
  assert.equal(result.ok, false, `${input} 应明确报错`);
  assert.ok(result.text.length > 0, `${input} 的错误反馈不能为空`);
  return result;
}

test('echo、引号和基础转义', () => {
  const shell = createShell();
  assert.equal(ok(shell, "echo 'hello world'").text, 'hello world');
  assert.equal(ok(shell, "echo -e 'one\\ntwo'").text, 'one\ntwo');
});

test('printf、sort、uniq 组成基础管道', () => {
  const shell = createShell();
  assert.equal(ok(shell, "printf '%s\\n' banana apple banana | sort | uniq -c").text, '      1 apple\n      2 banana');
});

test('wc 统计上一段管道的行数', () => {
  const shell = createShell();
  assert.equal(ok(shell, "echo -e 'one\\ntwo' | wc -l").text.trim(), '2');
});

test('cat、head、tail 读取站点虚拟文本', () => {
  const shell = createShell();
  const about = ok(shell, 'cat about').text.split('\n');
  assert.equal(ok(shell, 'cat about | head -n 2').text, about.slice(0, 2).join('\n'));
  const life = ok(shell, 'cat life').text.split('\n');
  assert.equal(ok(shell, 'tail -n +3 life').text, life.slice(2).join('\n'));
});

test('grep 字面搜索、忽略大小写与行号', () => {
  const shell = createShell();
  const result = ok(shell, "grep -in 'ai' about").text;
  assert.match(result, /^1:/);
  assert.match(result, /AI Native/);
  assert.equal(ok(shell, "grep -c '不存在' about").text, '0');
});

test('find、tree 与虚拟目录', () => {
  const shell = createShell();
  const files = ok(shell, 'find . -maxdepth 1 -type f').text;
  assert.match(files, /\.\/about/);
  assert.match(files, /\.\/life/);
  assert.match(ok(shell, 'tree').text, /projects/);
});

test('cd、pwd、ls 使用虚拟路径，不读取真实磁盘', () => {
  const shell = createShell();
  assert.equal(ok(shell, 'cd /projects').text, '');
  assert.equal(ok(shell, 'pwd').text, '/projects');
  assert.match(ok(shell, 'ls').text, /01/);
  assert.equal(shell.prompt(), 'zjq : /projects $');
  ok(shell, 'cd ..');
  assert.equal(ok(shell, 'pwd').text, '/');
});

test('cut 与 tr 处理上一段管道文本', () => {
  const shell = createShell();
  assert.equal(ok(shell, "printf 'name:score\\nzjq:42\\n' | cut -d: -f1").text, 'name\nzjq');
  assert.equal(ok(shell, "echo hello | tr '[:lower:]' '[:upper:]'").text, 'HELLO');
});

test('basename、dirname、realpath 规范化路径', () => {
  const shell = createShell();
  assert.equal(ok(shell, 'basename /projects/01').text, '01');
  assert.equal(ok(shell, 'dirname /projects/01').text, '/projects');
  assert.equal(ok(shell, 'realpath ./about').text, '/about');
});

test('stat 与 du 只报告虚拟文档大小', () => {
  const shell = createShell();
  assert.match(ok(shell, "stat -c '%n %s bytes' about").text, /^\/about \d+ bytes$/);
  assert.match(ok(shell, 'du -b about').text, /^\d+\s+\/about$/);
});

test('history 支持查看、清空与 !! 重跑', () => {
  const shell = createShell();
  ok(shell, 'echo first');
  assert.equal(ok(shell, '!!').text, 'first');
  assert.match(ok(shell, 'history').text, /echo first/);
  ok(shell, 'history -c');
  assert.equal(ok(shell, 'history').text, '');
});

test('more 与 less 能读取内容', () => {
  const shell = createShell();
  assert.equal(ok(shell, 'more about').text, ok(shell, 'cat about').text);
  assert.equal(ok(shell, 'less life').text, ok(shell, 'cat life').text);
});

test('ps 与 neofetch 只描述页面虚拟会话', () => {
  const shell = createShell();
  assert.match(ok(shell, 'ps -ef').text, /virtual-shell/);
  const info = ok(shell, 'neofetch --stdout').text;
  assert.match(info, /静态主页/);
  assert.doesNotMatch(info, /CPU|内存|显卡|Windows|macOS|Linux/);
});

test('页面命令返回明确动作', () => {
  const shell = createShell();
  assert.deepEqual(ok(shell, 'about').action, { type: 'jump', id: 'about' });
  assert.deepEqual(ok(shell, 'projects').action, { type: 'jump', id: 'projects' });
  assert.deepEqual(ok(shell, 'life').action, { type: 'jump', id: 'life' });
  assert.deepEqual(ok(shell, 'links').action, { type: 'jump', id: 'contact' });
  assert.deepEqual(ok(shell, 'index').action, { type: 'home' });
  assert.deepEqual(ok(shell, 'clear').action, { type: 'clear' });
});

test('help 列出真实命令，未知命令和不支持的选项明确报错', () => {
  const shell = createShell();
  const help = ok(shell, 'help').text;
  assert.match(help, /grep/);
  assert.match(help, /printf/);
  assert.match(help, /neofetch/);
  assert.match(bad(shell, 'does-not-exist').text, /command not found/);
  assert.match(bad(shell, 'grep -P AI about').text, /unsupported option/);
  assert.match(bad(shell, 'cat missing-file').text, /no such file/);
});

test('管道前一段出错时，后一段不会把错误当输入', () => {
  const shell = createShell();
  const result = bad(shell, 'cat missing-file | wc -l');
  assert.doesNotMatch(result.text, /^0$/);
});
