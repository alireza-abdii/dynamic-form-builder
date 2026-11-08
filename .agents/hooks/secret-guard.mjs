import fs from 'node:fs';

let input = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(input || '{}');
    const toolCall = payload.toolCall || {};
    const args = JSON.stringify(toolCall.args || {});

    // 1. Detect raw Telegram bot token patterns
    const telegramTokenPattern = /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/;
    if (telegramTokenPattern.test(args)) {
      console.log(JSON.stringify({
        decision: 'deny',
        reason: 'Blocked by secret-guard: Raw Telegram bot token detected in tool arguments. Use environment variables instead.'
      }));
      return;
    }

    // 2. Detect Google OAuth refresh tokens
    const googleTokenPattern = /\b1\/\/[A-Za-z0-9_-]{20,}\b/;
    if (googleTokenPattern.test(args)) {
      console.log(JSON.stringify({
        decision: 'deny',
        reason: 'Blocked by secret-guard: Google OAuth refresh token detected in tool arguments.'
      }));
      return;
    }

    // 3. Sensitive commands check
    if (toolCall.name === 'run_command') {
      const argsObj = toolCall.args || {};
      const rawCmd = argsObj.CommandLine || '';
      const cmd = String(rawCmd).toLowerCase();

      // Enforce safe clasp deployment
      if (cmd.includes('clasp deploy') && !cmd.includes('--deploymentid') && !cmd.includes('-i ')) {
        console.log(JSON.stringify({
          decision: 'deny',
          reason: 'Blocked by secret-guard: clasp deploy requires an explicit --deploymentId to prevent URL mutations. Use `npm run gas:deploy`.'
        }));
        return;
      }

      // Ask for confirmation on git push or webhook deletion
      if (cmd.includes('git push') || cmd.includes('telegram-setup.mjs --delete')) {
        console.log(JSON.stringify({
          decision: 'force_ask',
          reason: 'This operation pushes code or modifies remote webhooks. Please confirm.'
        }));
        return;
      }
    }

    // Default: allow
    console.log(JSON.stringify({ decision: 'allow' }));
  } catch (err) {
    // If parsing fails, allow safely
    console.log(JSON.stringify({ decision: 'allow' }));
  }
});
