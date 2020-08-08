import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/bilibili-live.min.js',
      format: 'cjs',
      name: 'bilibili-live',
      plugins: [terser()]
    }
  ]
}
