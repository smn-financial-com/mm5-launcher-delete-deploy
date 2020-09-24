'use strict';

import { app, protocol, session, ipcMain, dialog } from 'electron';
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import loginUtil from './loginUtil';
import mm2 from './mm2/service';
import mm2Props from './mm2/constants';
import mm5Props from './mm5/constants';
import mm5 from './mm5/service';
import uiController from './uiController';
import log from 'electron-log';
import path from 'path';
import LauncherError from './LauncherError';
import { autoUpdater } from 'electron-updater';

const isDevelopment = process.env.NODE_ENV !== 'production';
let isHTML = false,
  serverBase,
  userToken,
  isStandalone = true;

// isHTML = false;
// userToken = '6f21f66c-74db-4a09-a7f8-0df3ce942a1e';
// serverBase = 'https://advanceddashboard.pat.td.com:443';
// const updateServer = 'https://mm5-launcher-delete-deploy.vercel.app';
// const feed = `${updateServer}/update/${process.platform}/${app.getVersion()}`;
// console.log('Autoupdate feed URL:', feed);
// autoUpdater.setFeedURL(feed);

const isMac = process.platform === 'darwin';
const appData = path.join(app.getPath('userData'), `../${mm5Props.AppData}`);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let serverSettings = {};
let macProtocolUrl;
log.transports.file.level = 'debug';
autoUpdater.logger = log;

function createWindow() {
  parseCommandLineValues();
  console.log('Parsed values::', isHTML, serverBase, userToken, process.argv, process.argv0);
  win = uiController.createMainWindow();

  dialog.showMessageBox(win, {
    type: 'info',
    title: 'App Version',
    message: `Pushed New Version:: ${app.getVersion()}`,
  });
  if (!isDevelopment) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  if (isStandalone) {
    console.log('Standalone launch');
    uiController.loadPage();
    loginUtil.loadEnvironmentVariables().then(readServerSettings);
  } else {
    console.log('Authenticated %s launch (launch now)', isHTML ? 'HTML5' : 'Java');
    uiController.loadPage(`/home?msg=loading`);
    readServerSettings();
  }

  win.on('closed', () => {
    win = null;
  });
}

function sendStatusToWindow(...params) {
  log.info(params);
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.', info);
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.', info);
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
  sendStatusToWindow(log_message);
});
// autoUpdater.on('update-downloaded', (info) => {
//   sendStatusToWindow('Update downloaded', info);
// });

function readServerSettings() {
  setEnvGlobalVariable();
  const baseURL = serverBase || loginUtil.getBaseURL();
  console.log('Read server settings: ', baseURL);
  mm2.readServerSettings(baseURL, global.lang).then((settings) => {
    serverSettings = { ...settings };
    const remoteVersion = serverSettings[isMac ? 'launcherVersionOsX' : 'launcherVersionWindows'];
    const localVersion = mm2Props[`${isMac ? 'mac' : 'windows'}Version`];
    const allowed = remoteVersion && localVersion === remoteVersion;
    if (!allowed) {
      //redirect to download page - for rollback
      console.log('Version not upgraded!!', localVersion, remoteVersion);
      throw new LauncherError('useOldLauncher');
    }
    if (isStandalone) {
      const loginURL = settings.loginPageURL || loginUtil.getLoginURL();
      uiController.loadURL(loginURL);
    } else {
      authenticatedLogin();
    }
  });
}

function authenticatedLogin() {
  if (isHTML) {
    //Just add the domain cookies and redirect
    console.log('Launch Now:: HTML5:: ', userToken);
    mm5
      .verifyLogin(userToken)
      .then((cookies) => {
        //Just add the domain cookies and redirect
        if (cookies) {
          Object.keys(cookies).forEach((name) => {
            const cookieObj = {
              url: serverBase,
              name,
              ...cookies[name],
            };
            console.log('Set cookie obj:: ', cookieObj);
            session.defaultSession.cookies.set(cookieObj);
          });
        }
        //set the cookie in td.com domain and load the landing page
        loadHtmlLandingPage(serverBase, userToken);
      })
      .catch((err) => {
        console.error('Error in refreshToken::', err);
        // const loginURL = loginUtil.getLoginURL();
        // console.log('Redirecting to login:', loginURL);
        // win.loadURL(loginURL);
        throw new LauncherError('launchFailure');
      });
  } else {
    console.log('Launch Now:: Java:: ', userToken);
    uiController.loadPage(`/landing?baseURL=${serverBase}&userToken=${userToken}`);
  }
}

function parseCommandLineValues() {
  let protocolUrl = undefined;
  if (isMac) {
    protocolUrl = macProtocolUrl;
  } else {
    protocolUrl = process.argv ? process.argv[1] : undefined;
  }
  ({ isHTML, serverBase, userToken } = loginUtil.parseCommandLine(protocolUrl));
  isStandalone = !serverBase && !userToken;
  console.log('Command line values parsed:', isHTML, serverBase, userToken, isStandalone);
}

function preInit() {
  protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }]);
  //Register APP protocol
  if (!isMac) {
    app.setAsDefaultProtocolClient(loginUtil.AppProtocol);
  }

  app.commandLine.appendSwitch('disable-web-security');
  //temporary fix
  app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
  app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

  app.setPath('userData', appData);
  console.log('AppData Path:', appData);

  const filePath = path.join(appData, 'logs');
  log.transports.file.resolvePath = (variables) => {
    return path.join(filePath, variables.fileName);
  };
  Object.assign(console, log.functions); //redirect all console logs to logger
  setApplicationErrorHandling();
}

function setEnvGlobalVariable() {
  global.Env = serverBase || loginUtil.getBaseURL();
  global.app = app;
  global.lang = getCurrentLanguage();
  console.log('Lang set::', global.lang);
}

function getCurrentLanguage() {
  const locale = app.getLocale();
  const supportedLanguages = ['en', 'fr'];
  console.log('Locale Resolved:', locale);
  const getLanguage = (lang = 'en') => {
    return supportedLanguages.find((sl) => (lang.split(new RegExp(sl, 'gi')).length - 1 > 0 ? sl : null));
  };
  return getLanguage(locale);
}

function setApplicationErrorHandling() {
  process.on('uncaughtException', onApplicationError);
  process.on('unhandledRejection', onApplicationError);
}

function onApplicationError(error, name) {
  if (name === 'LauncherError' || error.name === 'LauncherError') {
    let msg = error.message;
    uiController.loadPage(`/error?msg=${msg}`);
  } else {
    console.error('Application Error. Not doing anything.', error);
  }
}

function loadHtmlLandingPage(serverBase, token) {
  console.log('load html landing page:', serverBase, token);
  const homeURL = path.join(serverBase, `/mm5/tdLanding${token ? '?sid=' + token : ''}`);
  uiController.loadURL(homeURL);
}

ipcMain.on('error', (event, info) => {
  onApplicationError(info.error, info.name);
});

ipcMain.on('notifyLoginComplete', (event, params) => {
  const serverBase = global.Env;
  const { token, isHtml } = params;
  console.log('Notify Login Complete (Main Process)::', serverBase, token, isHtml, process.type);
  if (!isHtml) {
    uiController.loadPage(`/landing?baseURL=${serverBase}&userToken=${token}`);
  } else {
    loadHtmlLandingPage(serverBase);
  }
});

app.on('open-url', (event, url) => {
  console.log('open url::', url);
  event.preventDefault();
  macProtocolUrl = url;
});
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

preInit();
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
