#! /usr/bin/env node

// Static website generator
const watch = require('node-watch');
const Listr = require('listr');
const { start } = require('live-server');

const markdown = require('./src/markdown');
const sass = require('./src/sass');
const image = require('./src/image');

const filter = /\.(js|sass|scss|md|hbs|liqui|jpg|jpeg)$/;
const wait = time => new Promise(resolve => setTimeout(resolve, time));

const compile = async (err, file) => {
  // Clear the console
  process.stdout.write('\033c');
  console.log('📜 Create Static Web');
  try {
    await new Listr([
      {
        title: file ? `Changed: ${file.replace(process.cwd(), '.')}` : 'Cold startup. It will take a while.',
        task: () => wait(300)
      },
      {
        title: 'Content: .md, .hbs, .liquid → .html',
        skip: () => file && !/\.(md|hbs|liquid)$/.test(file),
        task: () => markdown(file)
      },
      {
        title: 'Stylesheets: .sass → .min.css',
        skip: () => file && !/\.(sass|scss)$/.test(file),
        task: () => sass()
      },
      {
        title: 'Images: .src.jpg → .min.jpg',
        skip: () => file && !/\.src\.jpe?g$/.test(file),
        task: () => image()
      },
      {
        title: '[TODO] Javascript: .src.js → .min.js',
        skip: () => file && !/\.src\.js$/.test(file),
        task: () => wait(300)
      },
      {
        title: file ? 'Browser reloaded' : 'Browser opened',
        task: () => wait(300)
      }
    ]).run();
  } catch (error) {
    console.log('ERROR:', error);
  }
};

watch(process.cwd(), { recursive: true, filter }, compile);
compile();
start({ port: 3000, host: "localhost", logLevel: 0, open: true, ignore: /\.(scss|md)$/ });
