# Boilerplate for Webpack/ES6(Babel) project using Thorax and Backbone

Just clone this and you can start using Backbone with ES6.

A better module system and new ES6 syntax shouldn't be limited to newer technologies like React. For those who have constraints to use Backbone in their work, they still should be able to include ES6 syntax and keep learning.

## Usage
```
npm install
npm start
```

We are `webpack-dev-server` for development

So, head to `localhost:3000` to get started.

## Already Running

-  **Hot Replacement Module** - Change any line of code in any `.js` file in `src` directory or any `.scss` file in `sass` directory (include the sass module in `main.scss`), the browser will update the app.

-  Sass is getting pre-compiled for you using webpack-loaders

-  `.js` in `src` can be written in ES2015 and it will get compiled by webpack loaders

-  `Thorax` is available as a global. Every module created will get `$`, `_`, `Handlebars` and `Backbone` as dependency injection.

-  Linting can be done by `eslint src` provided `eslint`. You can get it to support in Sublime Text and Atom.