// Static website generator. Compiles three things:
// - Handlbars: compile all "name.hbs" into "name.html"
// - Markdown: compile all "name.md" into "index.html" using the layout template
// - SASS: compile all "name.scss" into "name.min.css"
// All of this while ignoring the partials (filenames startig by "_")
// import { start } from 'live-server';

import ignoreFiles from 'ignore';
import marked from 'marked';
import watch from 'node-watch';
import fm from 'front-matter';
import { abs, dir, exists, join, name, read, stat, walk, write } from 'fs-array';
// https://github.com/rollup/rollup-plugin-commonjs/issues/131
import hbs from 'handlebars/lib/handlebars.js';

// import Liquid from 'liquidjs';
// const liquid = Liquid().parseAndRender.bind(Liquid());

const Liquid = require('liquidjs');
const engine = Liquid();
const liquid = (...args) => engine.parseAndRender(...args);

const sass = require('node-sass');
const { start } = require('live-server');

// Check whether a folder has a 'readme.md' file or not
const hasReadme = src => exists(join(src, 'readme.md'));

// Find all the relevant data for a blog post entry (a folder)
const parseData = (file, i, blog) => {
  // const file = join(folder, 'readme.md');
  const folder = file.replace(/readme\.md$/, '');
  const { attributes: { layout, ...attr }, body } = fm(read(file));
  if (!layout) return;
  attr.layout = layout + ((/\.\w+$/.test(layout)) ? '' : '.liquid');
  attr.layout = '_' + attr.layout.replace(/^_/, '');
  return {
    id: folder.split('/').slice(-2).shift(),
    file,
    folder,
    ...attr,
      // Create the main handlebars template based on the selected layout
    // template: hbs.compile(`{{> ${attr.layout}}}`),
    body: marked(body)
  };
};

// Folders to ignore
const svc = ignoreFiles().add('.git');
if (exists('.gitignore')) svc.add(read('.gitignore'));
const ignore = src => !svc.ignores(src);

// Extensions to handle to changes
const filter = /\.(js|sass|scss|md|hbs|liquid)$/;
const isPartial = src => name(src)[0] === '_';
const isFull = src => !isPartial(src);
const ext = (...end) => src => end.find(ext => src.slice(-ext.length) === ext);


const compile = (err, file) => {
  // All of the valid filenames within the project
  const walked = walk(process.cwd()).filter(ignore).filter(src => filter.test(src));

  const templates = { hbs: {}, liquid: {}, pug: {} };

  // Handlebars import all '_name.hbs' in the blog folder as partials
  walked.filter(isPartial).filter(ext('hbs')).forEach(src => {
    const file = name(src, '.hbs').slice(1);
    templates.hbs[file] = read(src);
    hbs.registerPartial(file, read(src));
  });

  walked.filter(isPartial).filter(ext('liquid')).forEach(src => {
    templates.liquid[name(src, '.liquid').slice(1)] = src;
  });

  // Actual markdown parsing
  // const blog = dir(folder).filter(hasReadme).map(parseData).filter(a => a);
  const blog = walked.filter(ext('md')).map(parseData).filter(Boolean);
  blog.forEach(data => {
    const [layout, ext] = data.layout.slice(1).split('.');
    if (!templates[ext][layout]) {
      return console.log(`Couldn't find template "${layout}". Make sure you have a file named "${data.layout}"`);
    }
    if (ext === 'liquid') {
      liquid(read(templates.liquid[layout]), data).then(html => {
        write(join(data.folder, 'index.html'), html);
      });
    }
    if (ext === 'hbs') {
      const html = hbs.compile(`{{> ${layout}}}`)(data);
      write(join(data.folder, 'index.html'), html);
    }
  });

  // Render any .hbs in the page in place for a .html file
  walked.filter(isFull).filter(ext('hbs')).forEach(src => {
    const output = src.replace(/\.hbs$/, '.html');
    write(output, hbs.compile(read(src))({ blog }));
  });

  // Render any .hbs in the page in place for a .html file
  walked.filter(isFull).filter(ext('liquid')).forEach(src => {
    const { attributes, body } = fm(read(src));
    const output = src.replace(/\.liquid$/, '.html');
    liquid(body, { ...attributes, blog }).then(html => {
      setTimeout(() => {
        write(output, html);
      }, 100);
    });
  });

  // The SASS or SCSS is being modified, rebuild them all
  if (!file || /\.s(a|c)ss$/.test(file)) {
    // Only main scss that are not partials (ignore "_name.scss" )
    walked.filter(isFull).filter(ext('scss')).forEach(src => {
      const options = { file: src, outputStyle: 'compressed' };
      const output = src.replace(/\.s(a|c)ss$/, '.min.css');
      write(output, sass.renderSync(options).css.toString());
    });
  }
};

watch(process.cwd(), { recursive: true, filter }, compile);
compile();

start({ port: 3000, host: "localhost", open: true });
