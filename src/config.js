const { abs, exists } = require("files");

module.exports = async (ctx) => {
  if (await exists("./static.config.js")) {
    let fn = require(await abs("./static.config.js"));
    if (typeof fn === "function") {
      fn = await fn(ctx);
    }
    if (typeof fn === "object") {
      Object.assign(ctx, fn);
    }
  }
};
