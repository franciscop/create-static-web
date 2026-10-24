import { walk } from "files";
import cmd from "atocha";
import Observable from "zen-observable";
import { ignoreFiles } from "./helpers.js";

const dest = (file, q) => file.replace(/\.src\.jpe?g$/, `.q${q}.jpg`);

export default async (ctx, task) => {
  const files = walk();
  const q = ctx.quality || 50;

  return new Observable(async (observer) => {
    try {
      observer.next("Checking imagemagick");
      await cmd(`magick --version`);
    } catch (error) {
      if (/command not found/.test(error.message)) {
        task.skip(
          "Imagemagick not available, please install via 'brew install imagemagick'",
        );
      } else {
        throw error;
      }
    }

    observer.next(`Optimizing JPGs to ${q}%`);

    await files
      .filter(ignoreFiles)
      .filter(/\.src\.jpe?g$/)
      .map((file) => cmd(`magick ${file} -quality ${q}% ${dest(file, q)}`));

    observer.complete();
  });
};
