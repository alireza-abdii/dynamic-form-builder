import fs from 'node:fs';
import path from 'node:path';

let input = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
    input += chunk;
});

process.stdin.on('end', () => {
    try {
        const cwd = process.cwd();
        const formsDir = path.join(cwd, 'shared', 'forms');
        let forms = [];
        if (fs.existsSync(formsDir)) {
            forms = fs.readdirSync(formsDir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        }

        const message = `[Form Builder Workspace Active]
- Available Forms: ${forms.length > 0 ? forms.join(', ') : 'None registered yet'}
- Framework: React 19 + Vite + Tailwind CSS + shadcn/ui (RTL-first)
- Serverless: Google Apps Script + Google Sheets + Telegram Bot
- Run /new-form to scaffold new forms.`;

        console.log(JSON.stringify({
            injectSteps: [{
                systemMessage: {
                    systemMessage: message
                }
            }]
        }));
    } catch (err) {
        console.log(JSON.stringify({
            injectSteps: []
        }));
    }
});
