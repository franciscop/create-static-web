const { abs, exists, name, read } = require('fs-array');

// Check
const isPartial = src => name(src)[0] === '_';
const isFull = src => !isPartial(src);

const ignoreFiles = async () => {
  const svc = require('ignore')();
  svc.add('.git');
  if(await exists('.gitignore')) {
    svc.add(await read(abs('.gitignore')));
  }
  return src => !svc.ignores(src);
};

const clean = file => name(file).replace(/^\_/, '').replace(/\.[a-zA-Z]+$/, '');

module.exports = {
  clean,
  isPartial,
  isFull,
  ignoreFiles
};
