import { defineConfig } from 'rollup';
import pkg from './package.json';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';

const entry = 'lib/index.ts';

export default defineConfig([
  {
    input: entry,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    external: ['react'],
    plugins: [resolve(), commonjs(), typescript({ useTsconfigDeclarationDir: true }), terser()],
  },
  {
    input: entry,
    output: {
      file: pkg.browser,
      name: 'ReactJsonForm',
      format: 'umd',
      sourcemap: true,
    },
    external: ['react'],
    plugins: [resolve(), commonjs(), typescript(), terser()],
  },
  {
    input: entry,
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    external: ['react'],
    plugins: [resolve(), commonjs(), typescript(), terser()],
  },
]);
