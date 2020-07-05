const { exists, name, read } = require("files");

// Check
const isPartial = (src) => src.split("/").pop()[0] === "_";
const isFull = (src) => !isPartial(src);

// Make sure we only check the expected files
const ignoreFiles = async () => {
  const svc = require("ignore")();
  svc.add(".git");
  if (await exists(".gitignore")) {
    svc.add(await read(".gitignore"));
  }
  return (src) => !svc.ignores(src);
};

// Get a consistent, nice filename
const clean = (file) =>
  name(file)
    .replace(/^\_/, "")
    .replace(/\.[a-zA-Z]+$/, "");

module.exports = {
  clean,
  isPartial,
  isFull,
  ignoreFiles,
};
