import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import boundaries from 'eslint-plugin-boundaries';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * ARCHITECTURAL BOUNDARY ENFORCEMENT
 *
 * ⚠ THIS IS R-13 / NN-06, MADE MECHANICAL.
 *
 * Phase 1: "All pricing, cart maths, delivery-fee rules and phone normalisation
 * live in the domain layer as pure functions. This is the single most important
 * boundary in the codebase."
 *
 * A boundary that exists only in a document erodes. Under deadline someone will
 * import an adapter into a component "just this once", and the mock→HTTP swap at
 * Gate G2 will then fail in a way that takes days to unpick. So it is enforced by
 * lint, and a violation FAILS THE BUILD.
 *
 *   domain    → domain, tokens          ⚠ NO React. NO HTTP. NO adapters.
 *   ports     → domain
 *   adapters  → domain, ports, lib
 *   components→ domain, ports, lib      ⚠ NEVER an adapter.
 *   app       → everything              (the composition root)
 */
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'tokens', pattern: 'src/tokens/*' },
        // Pure copy + asset declarations. Depends on NOTHING — it is data.
        { type: 'content', pattern: 'src/content/*' },
        { type: 'domain', pattern: 'src/domain/**/*' },
        { type: 'ports', pattern: 'src/ports/*' },
        { type: 'adapters', pattern: 'src/adapters/**/*' },
        { type: 'lib', pattern: 'src/lib/**/*' },
        { type: 'components', pattern: 'src/components/**/*' },
        { type: 'app', pattern: 'src/app/**/*' },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'tokens', allow: ['tokens'] },
            // ⚠ Content is INERT DATA. It imports nothing, so it can never
            //   smuggle a dependency into a component via a copy file.
            { from: 'content', allow: [] },
            // ⚠ THE CRITICAL RULE. The domain is PURE.
            { from: 'domain', allow: ['domain', 'tokens'] },
            { from: 'ports', allow: ['domain', 'ports'] },
            // ⚠  added: the mock fixtures read the IMAGE SLOT REGISTRY,
            //   which is the single source of truth for what photography exists.
            //   Content is inert data and imports nothing, so this cannot smuggle
            //   a dependency in through the back door.
            { from: 'adapters', allow: ['domain', 'ports', 'lib', 'adapters', 'content'] },
            { from: 'lib', allow: ['domain', 'tokens', 'lib'] },
            // ⚠ `adapters` is deliberately ABSENT here. Components depend on
            //    port INTERFACES, never on an implementation.
            {
              from: 'components',
              allow: ['domain', 'ports', 'lib', 'tokens', 'components', 'content'],
            },
            // The app router IS the composition root.
            {
              from: 'app',
              allow: [
                'domain',
                'ports',
                'adapters',
                'lib',
                'tokens',
                'components',
                'content',
                'app',
              ],
            },
          ],
        },
      ],
    },
  },

  // ⚠ The domain layer: no framework, no network, full stop.
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'next', 'next/*', '@radix-ui/*'],
              message:
                'The domain layer is PURE TypeScript. It may not import React, Next or any UI library. [NN-06, R-13]',
            },
            {
              group: ['**/adapters/**'],
              message:
                'The domain may not import an adapter. Dependencies point INWARD. [R-13]',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'The domain performs no I/O. Move this to an adapter. [NN-06]' },
        { name: 'window', message: 'The domain is environment-agnostic.' },
        { name: 'document', message: 'The domain is environment-agnostic.' },
        { name: 'localStorage', message: 'The domain is environment-agnostic.' },
      ],
    },
  },

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'scripts/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
