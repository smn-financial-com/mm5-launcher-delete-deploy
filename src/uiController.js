import { BrowserWindow } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';

const path = require('path');
const url = require('url');
const baseURL =
  process.env.NODE_ENV !== 'production'
    ? url.resolve(process.env.WEBPACK_DEV_SERVER_URL, '/index.html')
    : `file://${__dirname}/index.html`;

let mainWindow;
function createMainWindow() {
  console.log('env', process.env.NODE_ENV, baseURL);
  // Create the browser window.
  mainWindow = null;
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      //nodeIntegration: true,
      //nodeIntegrationInWorker: true,
      webSecurity: false,
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true,
    },
    // eslint-disable-next-line no-undef
    icon: path.join(__static, 'icon.png'),
    title: 'TD Advanced Dashboard',
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    //hide the default menus
    createProtocol('app');
    mainWindow.setMenuBarVisibility(false);
  }
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  mainWindow.webContents.on('did-navigate', (event, url) => {
    if (url.includes('/mm5/tdLanding')) {
      console.log('Navigating to TD Landing page', url);
      mainWindow.maximize();
    }
  });

  mainWindow.on('close', () => {
    mainWindow.webContents.send('clearStorage');
  });

  return mainWindow;
}

function loadPage(page) {
  let URL;
  if (process.env.NODE_ENV !== 'production') {
    URL = page ? url.resolve(baseURL, `#${page.startsWith('/') ? page : '/' + page}`) : baseURL;
  } else {
    URL = page ? `${baseURL}#${page.startsWith('/') ? page : '/' + page}` : baseURL;
  }
  loadURL(URL);
}

function loadURL(URL) {
  let win = mainWindow;
  if (!mainWindow) {
    win = getRemoteWindow();
  }
  console.log('loading URL:' + URL);
  win.loadURL(URL);
}

function getRemoteWindow() {
  const remote = require('electron').remote;
  if (remote) {
    return remote.BrowserWindow.getFocusedWindow();
  }
}

export default {
  createMainWindow,
  loadPage,
  loadURL,
};
