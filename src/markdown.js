const { dir, join, read, walk, write } = require("files");
const swear = require("swear");
const fm = require("front-matter");
const Observable = require("zen-observable");
const marked = require("marked");
const Liquid = require("liquidjs");
const slugify = require("@sindresorhus/slugify");

// Override function
const renderer = {
  heading: (text, level) => `
    <h${level} id="${slugify(text)}">
      ${text}
    </h${level}>
  `,
};

marked.use({ renderer });

const { clean, ignoreFiles, isFull, isPartial } = require("./helpers");

const engine = Liquid();
const liquid = (...args) => engine.parseAndRender(...args);

const templates = {};

module.exports = async (ctx, task) =>
  new Observable(async (observable) => {
    try {
      const handlebars = require("handlebars");
      const ignore = await ignoreFiles();
      const files = walk().filter(ignore);

      const liq = await files
        .filter(isPartial)
        .filter(/\.liquid$/)
        .map(async (file) => [await clean(file), await read(file)])
        .reduce((obj, [name, value]) => ({ ...obj, [name]: value }), {});

      await files
        .filter(isFull)
        .filter(/\.liquid$/)
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
          const html = await liquid(body, {
            ...data,
            ...attributes,
            config: ctx,
          });
          return write(file, html);
        });

      const hbs = await files
        .filter(isPartial)
        .filter(/\.hbs$/)
        .map(async (file) => [await clean(file), await read(file)])
        .map(([name, content]) => handlebars.registerPartial(name, content));

      await files
        .filter(isFull)
        .filter(/\.hbs$/)
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
          const html = handlebars.compile(body)({
            ...data,
            ...attributes,
            config: ctx,
          });
          return write(file, html);
        });

      await files
        .filter(isFull)
        .filter(/\.md$/)
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
          return { ...data, content, body: content, config: ctx };
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
    } catch (error) {
      task.skip(error.message);
      console.error("ERROR:", error);
    } finally {
      observable.complete();
    }
  });
