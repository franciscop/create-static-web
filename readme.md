# Create-Static-Web

Another static site generator:

```bash
$ npm install create-static-web -g
$ web
```

|Transformations                     |Features                             |
|------------------------------------|-------------------------------------|
|`.liquid` `.hbs` → `.html`          |• Works out of the box               |
|`.md` + `layout:` → `.html`         |• Livereload                         |
|`.scss` `.sass` → `.min.css`        |• Extensible with hooks [WIP]        |
|`.src.js` → `.min.js` [WIP]         |• Basic compatibility with Jekyll    |


## Getting Started

Create your `readme.md`:

```md
---
layout: hello.hbs
---

Front-matter enabled website
```

Also your `_hello.hbs` file:

```js
<main>{{ body }}</main>
```

Voila! Your site should be ready to go:

```html
<main>
<p>Front-matter enabled website</p>
</main>
```


## Demo

Clone this repo and run web:

```bash
$ npm install create-static-web -g
$ git clone https://github.com/franciscop/create-static-web.git
$ cd create-static-web
$ web      # The browser will open with this readme
```


## Automatic compilation

The command `web` will automatically compile some extensions (explained below). **Except** if they also start by an underscore. Then they will be considered partials and not be rendered by default.


### Liquid template

These will be rendered (excluding [Partials](#partials)) into a file with the same name and the extension `html`:

- `./index.liquid` → `./index.html`
- `./demo.liquid` → `./demo.html`
- `./blog/index.liquid` → `./blog/index.html`

They will receive the data as specified in the [Data Specification](#data-specification):

```html
// index.liquid
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    ...
  </head>
  ...
</html>
```



### SASS and SCSS

The style files (excluding [Partials](#partials)) will be compiled to a file with the same name in the same folder, with the extension `.min.css`:

- `./style.scss` → `./style.min.css`
- `./demo.scss` → `./demo.min.css`
- `./blog/style.scss` → `./blog/style.min.css`

Then you have to include it in your template as normal:

```hbs
// index.hbs
<!DOCTYPE html>
<html>
  <head>
    ...
    <link rel="stylesheet" href="/style.min.css">
  </head>
  ...
</html>
```



Files ending with these extensions will be automatically compiled:

`.liquid`, `.hbs`, `.sass`, `.scss`

They are compiled to the same folder with the same filename. SASS and SCSS will add a `.min` to the extension to differentiate in case you have any `.css`.




## Partials

Partials are useful in two situation: as layouts and to be included in another files.




## Data Specification

A file called `static.config.js` **in the same folder** where the script is being run will be loaded as a configuration script.



### Front Matter

There is a special variable called `content` (aliased as `body`) which represents the Markdown content as html into your template:

```html
// index.liquid
<!DOCTYPE html>
<html>
  <head>
    <title>{{title}}</title>
    ...
  </head>
  <body>
    {{ body }}
  </body>
</html>
```
