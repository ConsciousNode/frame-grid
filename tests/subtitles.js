// Unit checks for the v2.4 subtitle parser and frame sync, run on the code in index.html.
// Zero dependencies: `node tests/subtitles.js`
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = src.indexOf('function parseSubTime('), b = src.indexOf('function clearSubs(');
if (a < 0 || b < 0) throw new Error('subtitle section not found');
const ctx = {}; vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
const { parseSubTime, parseSubtitles, cueTextAt, makeCueEmitter, fmtClock } = ctx;
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

ok(parseSubTime('00:01:02,500') === 62.5, 'srt time');
ok(parseSubTime('01:02.5') === 62.5, 'vtt short time, 1-digit ms');
ok(parseSubTime('1:00:00.000') === 3600, 'hours');
ok(Number.isNaN(parseSubTime('nope')), 'bad time');

const srt = '﻿1\r\n00:00:00,500 --> 00:00:02,000\r\n<i>Hello</i> there.\r\n\r\n2\r\n00:00:02,100 --> 00:00:03,900\r\n{\\an8}General\r\nKenobi!\r\n\r\n3\r\n00:00:05,000 --> 00:00:06,000\r\nA &amp; B\r\n';
const c1 = parseSubtitles(srt);
ok(c1.length === 3, 'srt count');
ok(c1[0].text === 'Hello there.' && c1[0].start === 0.5 && c1[0].end === 2, 'srt tags stripped');
ok(c1[1].text === 'General Kenobi!', 'srt multi-line + ssa override');
ok(c1[2].text === 'A & B', 'entities');

const vtt = 'WEBVTT - demo\n\nNOTE this is a comment\n\nSTYLE\n::cue { color: red }\n\nintro\n00:01.000 --> 00:02.000 align:start position:10%\n<v Kham>Hi <c.loud>Kehai</c></v>\n\n00:00.200 --> 00:00.900\nearly\n';
const c2 = parseSubtitles(vtt);
ok(c2.length === 2 && c2[0].text === 'early' && c2[1].text === 'Hi Kehai', 'vtt parse, sort, skip NOTE/STYLE, settings ignored');

ok(cueTextAt(c1, 1.0) === 'Hello there.', 'active at 1.0');
ok(cueTextAt(c1, 2.05) === '', 'gap');
ok(cueTextAt([{ start: 0, end: 2, text: 'a' }, { start: 1, end: 3, text: 'b' }], 1.5) === 'a / b', 'overlap');

// Sync: 1 fps sampling at t = 0,1,2,...; each cue emitted exactly once at the frame showing when it starts.
const em = makeCueEmitter(c1, 1);
const got = [0, 1, 2, 3, 4, 5].map(t => em.take(t).map(c => c.text));
ok(JSON.stringify(got) === JSON.stringify([['Hello there.'], [], ['General Kenobi!'], [], [], ['A & B']]), 'emission ' + JSON.stringify(got));
// Skipped frames (dedup): a line starting during skipped samples lands on the next kept frame, not lost.
const em2 = makeCueEmitter(c1, 1);
const got2 = [0, 4, 5].map(t => em2.take(t).length);
ok(got2.join() === '1,1,1' && em2.remaining() === 0, 'carry over skipped frames');
ok(fmtClock(62.5) === '1:02.5' && fmtClock(3.25) === '0:03.3', 'clock ' + fmtClock(3.25));
console.info(`subtitles: ${n} checks OK`);
