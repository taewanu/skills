#!/usr/bin/env node
const { readMode, emit, RULES } = require('./dambaek-runtime');

if (readMode() !== 'off') emit('SubagentStart', RULES);
