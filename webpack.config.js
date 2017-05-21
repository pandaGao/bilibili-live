var path = require('path')

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bilibili-live.js",
    library: "BilibiliLive",
    libraryTarget: "commonjs2"
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
  externals: [
    "lodash",
    "ws"
  ],
  target: "node"
}
