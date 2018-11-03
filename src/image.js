const { abs, walk, write } = require('fs-array');
const magic = require('magic-promises');
const cmd = require('atocha');
const { ignoreFiles } = require('./helpers');

const dest = (file, q) => file.replace(/\.src\.jpe?g$/, `.q${q}.jpg`);

module.exports = async (files = walk()) => {
  if (typeof files === 'string') files = [files];
  files = files ? magic(files.map(abs)) : walk();
  const q = 50;

  return files
    .filter(await ignoreFiles())
    .filter(file => /\.src\.jpe?g$/.test(file))
    .map(file => cmd(`convert ${file} -quality ${q}% ${dest(file, q)}`));
};
