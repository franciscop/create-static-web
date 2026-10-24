import { walk, write } from "files";
import * as sass from "sass";
import { ignoreFiles, isFull } from "./helpers.js";

const dest = (file) => file.replace(/\.s(a|c)ss$/, ".min.css");
const render = (file) =>
  sass.renderSync({ file, outputStyle: "compressed" }).css.toString();

export default async () => {
  const ignore = await ignoreFiles();
  return walk()
    .filter(ignore)
    .filter(isFull)
    .filter(/\.scss$/)
    .map((file) => write(dest(file), render(file)));
};
