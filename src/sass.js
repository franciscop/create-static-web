const { walk, write } = require("files");
const sass = require("sass");
const { ignoreFiles, isFull } = require("./helpers");

const dest = (file) => file.replace(/\.s(a|c)ss$/, ".min.css");
const render = (file) =>
  sass.renderSync({ file, outputStyle: "compressed" }).css.toString();

module.exports = async () => {
  const ignore = await ignoreFiles();
  return walk()
    .filter(ignore)
    .filter(isFull)
    .filter(/\.scss$/)
    .map((file) => write(dest(file), render(file)));
};
