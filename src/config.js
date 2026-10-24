import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { abs, exists } from "files";

const require = createRequire(import.meta.url);

export default async (ctx) => {
  if (await exists("./static.config.js")) {
    const file = await abs("./static.config.js");
    // Bust the CJS (delete) and ESM (query) caches so edits apply on reload
    delete require.cache[require.resolve(file)];
    const url = `${pathToFileURL(file)}?t=${Date.now()}`;
    let fn = (await import(url)).default;
    if (typeof fn === "function") {
      fn = await fn(ctx);
    }
    if (typeof fn === "object") {
      Object.assign(ctx, fn);
    }
  }
};
