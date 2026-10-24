#! /usr/bin/env node

// Static website generator
const watch = require("node-watch");
const Listr = require("listr");
const { start } = require("live-server");

const config = require("./src/config");
const markdown = require("./src/markdown");
const sass = require("./src/sass");
const image = require("./src/image");

const filter = /\.(js|sass|scss|md|hbs|liqui|jpg|jpeg)$/;
const wait = (time) => new Promise((resolve) => setTimeout(resolve, time));

// Limit it to a single instance at once
let running = false;
const compile = async (err, file) => {
  if (running) return;
  running = true;
  // Clear the console
  process.stdout.write("\033c");
  console.log("📜 Create Static Web");
  try {
    await new Listr([
      {
        title: file
          ? `Changed: ${file.replace(process.cwd(), ".")}`
          : "Cold startup. It might take a while.",
        task: () => wait(300),
      },
      {
        title: "Reading configuration",
        task: config,
      },
      {
        title: "Content: .md, .hbs, .liquid → .html",
        skip: () =>
          file &&
          !/\.(md|hbs|liquid)$/.test(file) &&
          !file.endsWith("static.config.js"),
        task: markdown,
      },
      {
        title: "Stylesheets: .sass → .min.css",
        skip: () =>
          file &&
          !/\.(sass|scss)$/.test(file) &&
          !file.endsWith("static.config.js"),
        task: sass,
      },
      {
        title: "Images: .src.jpg → .min.jpg",
        skip: () =>
          file &&
          !/\.src\.jpe?g$/.test(file) &&
          !file.endsWith("static.config.js"),
        task: image,
      },
      {
        title: "[TODO] Javascript: .src.js → .min.js",
        skip: () =>
          file && !file.endsWith(".src.js") && !file.endsWith("static.config.js"),
        task: () => wait(300),
      },
      {
        title: file ? "Browser reloaded" : "Browser opened",
        task: () => wait(300),
      },
    ]).run({ file });
  } catch (error) {
    console.log("ERROR:", error);
  } finally {
    running = false;
  }
};

watch(process.cwd(), { recursive: true, filter }, compile);
compile();
start({
  port: 3000,
  host: "localhost",
  logLevel: 0,
  open: true,
  ignore: /\.(scss|md)$/,
});
