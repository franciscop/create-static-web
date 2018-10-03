const { abs, dir, join, read, walk, write } = require('fs-array');
const magic = require('magic-promises');
const fm = require('front-matter');
const marked = require('marked');
const Liquid = require('liquidjs');

const { clean, ignoreFiles, isFull, isPartial } = require('./helpers');

const engine = Liquid();
const liquid = (...args) => engine.parseAndRender(...args);

const templates = {};

module.exports = async (files) => {
  try {
    const handlebars = require('handlebars');

    const base = walk().filter(await ignoreFiles());
    files = files && (/\.md/.test(files)) ? magic([files]) : base;

    const liq = await base
      .filter(isPartial)
      .filter(file => /\.liquid/.test(file))
      .map(async file => [clean(file), await read(file)])
      .reduce((obj, [name, value]) => ({ ...obj, [name]: value }), {});

    await base
      .filter(isFull)
      .filter(file => /\.liquid/.test(file))
      .map(async file => ({ name: clean(file), folder: dir(file), text: await read(file) }))
      .map(async data => {
        data.id = data.name === 'readme' ? data.folder.split('/').pop() : data.name;
        data.name = data.name === 'readme' ? 'index' : data.name;
        const file = join(data.folder, data.name + '.html');
        const html = await liquid(data.text, data);
        return write(file, html);
      });

    const hbs = await base
      .filter(isPartial)
      .filter(file => /\.hbs/.test(file))
      .map(async file => [clean(file), await read(file)])
      .map(([name, content]) => handlebars.registerPartial(name, content));

    await base
      .filter(isFull)
      .filter(file => /\.hbs/.test(file))
      .map(async file => ({ name: clean(file), folder: dir(file), text: await read(file) }))
      .map(data => {
        data.id = data.name === 'readme' ? data.folder.split('/').pop() : data.name;
        data.name = data.name === 'readme' ? 'index' : data.name;
        const file = join(data.folder, data.name + '.html');
        const html = handlebars.compile(data.text)(data);
        return write(file, html);
      });

    return files
      .filter(isFull)
      .filter(file => /\.md/.test(file))
      .map(async file => ({ name: clean(file), folder: dir(file), text: await read(file) }))
      .map(({ text, ...data }) => ({ ...data, ...fm(text) }))
      .map(({ attributes, frontmatter, ...rest }) => ({ ...rest, ...attributes }))
      .filter(({ layout }) => layout)
      .map(({ body, ...data }) => ({ ...data, body: marked(body) }))
      .map(async data => {
        data.id = data.name === 'readme' ? data.folder.split('/').pop() : data.name;
        const name = data.name === 'readme' ? 'index' : data.name;
        const file = join(data.folder, name + '.html');

        if (/\.liquid/.test(data.layout)) {
          const html = await liquid(liq[clean(data.layout)], data);
          return write(file, html);
        }

        if (/\.hbs/.test(data.layout)) {
          const html = handlebars.compile(`{{> ${clean(data.layout)}}}`)(data);
          return write(file, html);
        }
      });
  } catch (error) {
    console.error('ERROR:', error);
  }
};
