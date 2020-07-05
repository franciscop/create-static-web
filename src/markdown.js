const { dir, join, read, walk, write } = require("files");
const swear = require("swear");
const fm = require("front-matter");
const Observable = require("zen-observable");
const marked = require("marked");
const Liquid = require("liquidjs");

const { clean, ignoreFiles, isFull, isPartial } = require("./helpers");

const engine = Liquid();
const liquid = (...args) => engine.parseAndRender(...args);

const templates = {};

module.exports = async (files) =>
  new Observable(async (observable) => {
    try {
      const handlebars = require("handlebars");
      const ignore = await ignoreFiles();

      const base = walk().filter(ignore);
      files = files && /\.md/.test(files) ? swear([files]) : base;

      const liq = await base
        .filter(isPartial)
        .filter((file) => /\.liquid/.test(file))
        .map(async (file) => [await clean(file), await read(file)])
        .reduce((obj, [name, value]) => ({ ...obj, [name]: value }), {});

      await base
        .filter(isFull)
        .filter((file) => /\.liquid/.test(file))
        .map(async (file) => ({
          name: await clean(file),
          folder: await dir(file),
          text: await read(file),
        }))
        .map(async ({ text, ...data }) => {
          const { attributes, body } = fm(text);
          data.id =
            data.name === "readme" ? data.folder.split("/").pop() : data.name;
          data.name = data.name === "readme" ? "index" : data.name;
          const file = await join(data.folder, data.name + ".html");
          const html = await liquid(body, { ...data, ...attributes });
          return write(file, html);
        });

      const hbs = await base
        .filter(isPartial)
        .filter((file) => /\.hbs/.test(file))
        .map(async (file) => [await clean(file), await read(file)])
        .map(([name, content]) => handlebars.registerPartial(name, content));

      await base
        .filter(isFull)
        .filter((file) => /\.hbs/.test(file))
        .map(async (file) => ({
          name: await clean(file),
          folder: await dir(file),
          text: await read(file),
        }))
        .map(async ({ text, ...data }) => {
          const { attributes, body } = fm(text);
          data.id =
            data.name === "readme" ? data.folder.split("/").pop() : data.name;
          data.name = data.name === "readme" ? "index" : data.name;
          const file = await join(data.folder, data.name + ".html");
          const html = handlebars.compile(body)({ ...data, ...attributes });
          return write(file, html);
        });

      await files
        .filter(isFull)
        .filter((file) => /\.md/.test(file))
        .map(async (file) => ({
          name: await clean(file),
          folder: await dir(file),
          text: await read(file),
        }))
        .map(({ text, ...data }) => ({ ...data, ...fm(text) }))
        .map(({ attributes, frontmatter, ...rest }) => ({
          ...rest,
          ...attributes,
        }))
        .filter(({ layout }) => layout)
        .map(({ body, ...data }) => {
          const content = marked(body);
          return { ...data, content, body: content };
        })
        .map(async (data) => {
          data.id =
            data.name === "readme" ? data.folder.split("/").pop() : data.name;
          const name = data.name === "readme" ? "index" : data.name;
          const file = await join(data.folder, name + ".html");

          if (/\.liquid/.test(data.layout)) {
            const html = await liquid(liq[await clean(data.layout)], data);
            return write(file, html);
          }

          if (/\.hbs/.test(data.layout)) {
            const html = handlebars.compile(
              `{{> ${await clean(data.layout)}}}`
            )(data);
            return write(file, html);
          }
        });
      observable.complete();
    } catch (error) {
      console.error("ERROR:", error);
    }
  });
