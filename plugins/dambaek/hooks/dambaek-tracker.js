#!/usr/bin/env node
const { readMode, writeMode, emit } = require('./dambaek-runtime');

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let prompt = '';
  try {
    prompt = (JSON.parse(input.replace(/^\uFEFF/, '')).prompt || '')
      .trim()
      .toLowerCase();
  } catch {}

  if (/^\/(dambaek:)?dambaek(\s|$)/.test(prompt)) {
    const arg = prompt.split(/\s+/)[1] || '';
    if (arg === 'off') {
      writeMode('off');
      emit('UserPromptSubmit', 'DAMBAEK MODE OFF');
    } else {
      writeMode('on');
      emit('UserPromptSubmit', 'DAMBAEK MODE ACTIVE');
    }
    return;
  }

  if (/^(stop dambaek|normal mode)$/.test(prompt)) {
    writeMode('off');
    emit('UserPromptSubmit', 'DAMBAEK MODE OFF');
    return;
  }

  if (readMode() !== 'off') {
    emit(
      'UserPromptSubmit',
      'DAMBAEK MODE ACTIVE: 기름기 없는 응답 + 타이핑 최소화 규칙 적용 중.',
    );
  }
});
