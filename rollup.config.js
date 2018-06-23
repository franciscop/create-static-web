// rollup.config.js
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import builtinlist from 'builtin-modules';
import replace from 'rollup-plugin-re';
import inject from 'rollup-plugin-inject';

export default {
  input: 'index.js',
  output: {
    file: 'index.min.js',
    format: 'cjs',
    name: 'packages'
  },
  external: builtinlist,
  plugins: [
    json(),
    babel({
      include: ['node_modules/**'],
    }),
    // inject({ window: { Promise } }),
    resolve({
      jsnext: true,
      main: true,
      preferBuiltins: false
    }),
    // replace({
    //   patterns: [
    //     {
    //       // formidable fix: https://github.com/rollup/rollup-plugin-commonjs/issues/166
    //       // regexp match with resolved path
    //       match: /formidable(\/|\\)lib/,
    //       // string or regexp
    //       test: 'if (global.GENTLY) require = GENTLY.hijack(require);',
    //       // string or function to replaced with
    //       replace: '',
    //     }
    //   ]
    // }),
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: [ "./index.min.js", "./node_modules/**" ], // Default: undefined

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false, // Default: true
    }),
    // globals({ window: { Promise: Promise }}),
    builtins(),
  ]
};
