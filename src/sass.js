const { abs, walk, write } = require('fs-array');
const magic = require('magic-promises');
const sass = require('node-sass');
const { ignoreFiles, isPartial, isFull } = require('./helpers');

const dest = file => file.replace(/\.s(a|c)ss$/, '.min.css');
const render = file => sass.renderSync({ file, outputStyle: 'compressed' }).css.toString();

module.exports = async (files = walk()) => {
  if (typeof files === 'string') files = [files];
  files = files ? magic(files.map(abs)) : walk();

  return files
  .filter(await ignoreFiles())
  .filter(isFull)
  .filter(file => /\.scss$/.test(file))
  .map(file => write(dest(file), render(file)));
};
