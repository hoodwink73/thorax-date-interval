var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/dev-server',
    './src/main.js'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
    ),
    new webpack.ProvidePlugin({
        $: 'jquery',
        'Handlebars': 'handlebars',
        '_': 'underscore',
        'Backbone': 'backbone',
    })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src')
    },
    {
        test: /\.scss$/,
        loaders: ['style', 'css', 'autoprefixer?browsers=last 2 version', 'sass'],
        include: path.join(__dirname, 'sass')
    },
    // we are loading in bootstrap css
    // we need to apply the style loader
    {
      test: /\.css$/,
      loaders: ['style','css'],
      include: path.join(__dirname, 'bower_components/bootstrap')
    },
    {
      test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000'
    }
  ]
  },
  resolve: {
      root: [path.join(__dirname, 'bower_components')],
      alias: {
        'thorax': '../bower_components/thorax/thorax.js',
        'bootstrap_css': '../bower_components/bootstrap/dist/css/bootstrap.css',
        'bootstrap_js': '../bower_components/bootstrap/dist/js/bootstrap.js',
      }
  }
};
