import fs from 'node:fs';

let input = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  // Always output valid empty JSON object to satisfy PostToolUse contract
  console.log(JSON.stringify({}));
});
