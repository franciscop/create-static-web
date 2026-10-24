import { dir, join, read, walk, write } from "files";
import fm from "front-matter";
import handlebars from "handlebars";
import Observable from "zen-observable";
import { marked } from "marked";
import { Liquid } from "liquidjs";
import slugify from "@sindresorhus/slugify";
import { clean, ignoreFiles, isFull, isPartial } from "./helpers.js";

// Override function
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    return `
    <h${depth} id="${slugify(text)}">
      ${text}
    </h${depth}>
  `;
  },
};

marked.use({ renderer });

const engine = new Liquid();
const liquid = (...args) => engine.parseAndRender(...args);

export default async (ctx, task) =>
  new Observable(async (observable) => {
    try {
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

      await files
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
        .map((data) => {
          const { attributes, frontmatter: _, ...rest } = data;
          return { ...rest, ...attributes };
        })
        .filter(({ layout }) => layout)
        .map(({ body, ...data }) => {
          const content = marked(body);
          console.log(body, data);
          return { ...data, content, body: content, config: ctx };
        })
        .map(async (data) => {
          data.id =
            data.name === "readme" ? data.folder.split("/").pop() : data.name;
          const name = data.name === "readme" ? "index" : data.name;
          data.title = data.title
            ? marked(data.title)
                .trim()
                .replace(/<\/?p\s?>/g, "")
            : "";
          const file = await join(data.folder, name + ".html");

          if (/\.liquid/.test(data.layout)) {
            const html = await liquid(liq[await clean(data.layout)], data);
            return write(file, html);
          }

          if (/\.hbs/.test(data.layout)) {
            const html = handlebars.compile(
              `{{> ${await clean(data.layout)}}}`,
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
