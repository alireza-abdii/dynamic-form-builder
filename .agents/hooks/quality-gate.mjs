import {
    execSync
} from 'node:child_process';

let input = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
    input += chunk;
});

process.stdin.on('end', () => {
    try {
        execSync('npm run typecheck', {
            stdio: 'pipe'
        });
        console.log(JSON.stringify({
            decision: 'stop'
        }));
    } catch (error) {
        console.log(JSON.stringify({
            decision: 'continue',
            reason: `Quality Gate Failed: Typecheck errors detected.\n${error.stdout?.toString() || error.message}`
        }));
    }
});
