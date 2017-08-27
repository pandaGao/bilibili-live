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
  ]
};
