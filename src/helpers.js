import path from "node:path";
import { exists, name, read } from "files";
import ignore from "ignore";

// Check
const isPartial = (src) => src.split("/").pop()[0] === "_";
const isFull = (src) => !isPartial(src);

// Make sure we only check the expected files
const ignoreFiles = async () => {
  const svc = ignore();
  svc.add(".git");
  if (await exists(".gitignore")) {
    svc.add(await read(".gitignore"));
  }
  return (src) => !svc.ignores(path.relative(process.cwd(), src));
};

// Get a consistent, nice filename
const clean = (file) =>
  name(file)
    .replace(/^_/, "")
    .replace(/\.[a-zA-Z]+$/, "");

export { clean, isPartial, isFull, ignoreFiles };
