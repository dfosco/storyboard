import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', '.worktrees', '.github', 'packages/core/dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'vitest.setup.js'],
    languageOptions: {
      globals: { ...globals.vitest, ...globals.node },
    },
  },
  {
    files: [
      '**/vite.config.js',
      '**/vitest.config.js',
      '**/vitest.*.config.js',
      'eslint.config.js',
      'scripts/**/*.js',
      '**/scaffold.js',
      'packages/core/src/cli/**/*.js',
      'packages/core/src/canvas/**/*.js',
      'packages/core/src/worktree/**/*.js',
      'packages/core/src/rename-watcher/**/*.js',
      'packages/core/src/autosync/**/*.js',
      'packages/core/src/server/**/*.js',
      'packages/core/src/vite/**/*.js',
      'packages/core/src/tools/**/*.js',
      'packages/react/src/vite/**/*.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
]
