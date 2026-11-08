import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.clasprc.json',
      '**/generated/**',
      '**/.claude/**',
      '**/.agents/**',
      '**/.git/**',
      'gas-backend/gas-entry-footer.js'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    rules: {
      // Enforce RTL-friendly logical Tailwind classes: ban physical direction classes
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\b(ml-|mr-|pl-|pr-|left-|right-|text-left|text-right)/]',
          message: 'Physical direction Tailwind classes (ml-, mr-, pl-, pr-, left-, right-, text-left, text-right) are forbidden for RTL support. Use logical utilities (ms-, me-, ps-, pe-, start-, end-, text-start, text-end) instead.'
        }
      ]
    }
  }
];
