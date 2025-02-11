import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import cssnano from 'cssnano';

export default {
  input: 'src/search.js',
  output: {
    file: 'dist/search.min.js',
    format: 'iife',
    name: 'MagicPagesSearch'
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({
        NODE_ENV: 'production'
      })
    }),
    postcss({
      config: false,
      plugins: [
        cssnano({
          preset: ['default', {
            discardComments: { removeAll: true }
          }]
        })
      ],
      inject: true,
      minimize: true,
      extract: false
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs({
      include: /node_modules/,
      transformMixedEsModules: true
    }),
    terser({
      format: {
        comments: false
      },
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    })
  ]
};