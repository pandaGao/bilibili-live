var path = require('path')

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bilibili-live.js",
    libraryTarget: "commonjs-module"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        options: {
          presets: ["es2015"]
        }
      }
    ]
  },
  resolve: {
    alias: {
      "lodash": "lodash/lodash.min.js"
    }
  },
  target: "node"
}
