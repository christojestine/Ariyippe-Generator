import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  entry: { main: "./src/main.jsx" },
  output: {
    // Relative URLs so dist/ works from any sub-path (e.g. GitHub Pages).
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    extensions: ["...", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            parser: { syntax: "ecmascript", jsx: true },
            transform: { react: { runtime: "automatic", development: isDev } },
          },
        },
        type: "javascript/auto",
      },
      { test: /\.css$/, type: "css/auto" },
      { test: /\.(ttf|woff2?|png|jpe?g|svg)$/, type: "asset/resource" },
    ],
  },
  plugins: [new rspack.HtmlRspackPlugin({ template: "./index.html" })],
  devServer: { port: 5173, open: false },
  performance: { hints: false },
});
