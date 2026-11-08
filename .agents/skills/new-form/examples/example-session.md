# Example `/new-form` Invocation

## User Prompt
`/new-form Form for registering employees for lunch: name, employee ID, food choice (kebab, ghormeh sabzi, salad), and date.`

## Agent Execution
1. Reads `references/field-types.md`.
2. Infers slug: `lunch-registration`.
3. Creates `shared/forms/lunch-registration.json` with fields:
   - `fullName` (text, required)
   - `employeeCode` (text, digits-only, required)
   - `foodChoice` (select: kebab, ghormeh, salad)
   - `deliveryDate` (jalali-date, minDate: "today")
4. Executes `node .agents/skills/new-form/scripts/scaffold-form.mjs lunch-registration`.
5. Prompts for deploy confirmation and runs `npm run gas:deploy`.
6. Generates URLs:
   - Web URL: `https://forms.example.com/f/lunch-registration`
   - Telegram Mini App: `https://t.me/MyOrgBot/forms?startapp=lunch-registration`
   - Export command: `/export lunch-registration`

