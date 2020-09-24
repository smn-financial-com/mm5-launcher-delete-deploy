const path = require('path');

module.exports = {
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.vue', '.json'],
    },
  },
  pluginOptions: {
    electronBuilder: {
      //nodeIntegration: true,
      externals: ['fs', 'child_process', 'node-jre', 'os'],
      builderOptions: {
        // options placed here will be merged with default configuration and passed to electron-builder
        appId: 'mm5-customer-td-launcher',
        productName: 'TD Advanced Dashboard',
        mac: {
          category: 'public.app-category.finance',
          extendInfo: {
            CFBundleURLTypes: [
              {
                CFBundleTypeRole: 'Editor',
                CFBundleURLIconFile: 'icon',
                CFBundleURLName: 'TD Advanced Dashboard',
                CFBundleURLSchemes: ['advanceddashboardtd'],
              },
            ],
          },
        },
        publish: [
          {
            provider: 's3',
            bucket: 'swami-launcher',
          },
        ],
        win: {
          target: 'nsis',
        },
        nsis: {
          license: 'license.txt',
        },
        extraResources: [
          {
            from: 'node_modules/regedit/vbs',
            to: 'regedit/vbs',
            filter: ['**/*'],
          },
          {
            from: 'src/mm2/resources',
            to: 'mm2',
          },
          {
            from: 'node_modules/node-jre/jre',
            to: 'jre',
            filter: ['**/*'],
          },
        ],
      },
      files: ['src/renderer/preload.js'],
      //files: [{ from: 'node_modules/node-jre/jre', to: 'jre', filter: ['**/*'] }],
      preload: 'src/renderer/preload.js',
    },
  },
  pages: {
    index: {
      // entry for the page
      entry: 'src/renderer/main.js',
      // the source template
      template: 'public/index.html',
      // output as dist/index.html
      filename: 'index.html',
    },
  },
};
