const { abs, exists } = require("files");

module.exports = async (ctx) => {
  if (await exists("./static.config.js")) {
    const file = await abs("./static.config.js");
    delete require.cache[require.resolve(file)];
    let fn = require(file);
    if (typeof fn === "function") {
      fn = await fn(ctx);
    }
    if (typeof fn === "object") {
      Object.assign(ctx, fn);
    }
  }
};
