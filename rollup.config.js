import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/bilibili-live.js',
      format: 'cjs',
      name: 'bilibili-live'
    },
    {
      file: 'dist/bilibili-live.esm.js',
      format: 'es',
      name: 'bilibili-live'
    }
  ],
  plugins: [
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};
