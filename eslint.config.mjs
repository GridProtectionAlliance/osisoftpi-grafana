import { defineConfig } from 'eslint/config';
import baseConfig from './.config/eslint.config.mjs';

export default defineConfig([
  {
    ignores: [
      '**/logs',
      '**/*.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/pids',
      '**/*.pid',
      '**/*.seed',
      '**/*.pid.lock',
      '**/lib-cov',
      '**/coverage',
      '**/node_modules',
      '**/dist',
      '**/vendor',
      '**/.tscache',
      '**/.idea',
      '**/.vscode',
      '**/.eslintcache',
      '**/.DS_Store',
      '**/codealike.json',
    ],
  },
  ...baseConfig,
]);
