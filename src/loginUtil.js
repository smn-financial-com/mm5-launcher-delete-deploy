/** Main process */
import { app, remote } from 'electron';

import os from 'os';
import path from 'path';
import config from './mm5/constants';
import fs from 'fs';
import regedit from 'regedit';
import plist from 'plist';

let CurrentEnv = config.Env;
const RegistryKeyRoot = 'HKCU\\Software\\financial\\Advanced Dashboard';

function loadWindowsRegistry() {
  const isProd = process.env.NODE_ENV === 'production';

  // eslint-disable-next-line no-undef
  const appPath = (app || remote.app).getAppPath();
  let vbsLocation = path.join(appPath, '../node_modules/regedit/vbs');
  if (isProd) {
    vbsLocation = path.join(path.dirname(app.getPath('exe')), 'resources/regedit/vbs');
  }
  console.log('vbs location::', vbsLocation);
  regedit.setExternalVBSLocation(vbsLocation);
  return new Promise((resolve) => {
    regedit.list(RegistryKeyRoot, (err, result) => {
      if (err === null) {
        const regValues = result[RegistryKeyRoot].values;
        console.log('reg values::', regValues);
        Object.keys(regValues).forEach((k) => {
          if (k.toLowerCase() === 'environment') {
            const regEnv = regValues[k].value ? regValues[k].value.toUpperCase() : '';
            if (config.TdLoginURL[regEnv]) {
              CurrentEnv = regEnv;
            }
          }
        });
        resolve();
      } else {
        resolve();
      }
    });
  });
}

function loadMacPlist() {
  return new Promise((resolve) => {
    const desktop = path.join(os.homedir(), 'Desktop');
    const plistFile = path.join(desktop, 'com.financial.LauncherTD.targetEnvironment.plist');
    if (fs.existsSync(plistFile)) {
      const pl = plist.parse(fs.readFileSync(plistFile, 'utf8'));
      console.log('Plist:', pl);
      if (pl.Environment && config.TdLoginURL[pl.Environment.toUpperCase()]) {
        CurrentEnv = pl.Environment.toUpperCase();
      }
    }
    resolve();
  });
}

function loadEnvironmentVariables() {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      loadWindowsRegistry().then(resolve);
    } else if (os.platform() === 'darwin') {
      loadMacPlist().then(resolve);
    } else {
      resolve();
    }
  });
}

function getCurrentEnvironment() {
  return CurrentEnv;
}

function getLoginURL() {
  return config.TdLoginURL[CurrentEnv];
}

function getBaseURL() {
  return config.BaseURL[CurrentEnv];
}

function parseCommandLine(arg) {
  console.log('Command line arg::', arg);
  if (arg && arg.indexOf(config.AppProtocol) > -1) {
    if (arg.indexOf('?') > -1) {
      let queryParams = arg.substring(arg.indexOf('?') + 1);
      if (queryParams.length) {
        const queryObj = queryParams.split('&').reduce((acc, val) => {
          const s = val.split('=');
          acc[s[0]] = s[1];
          return acc;
        }, {});
        const serverBase = queryObj.serverBase;
        const urlre = /^(?:https?:)?(?:\/\/)?(advanceddashboard\.([^.]*)\.?td\.com)/gm;
        const matches = urlre.exec(serverBase);
        console.log('matches:', matches);
        if (matches != null && matches[2]) {
          if (config.TdLoginURL[matches[2].toUpperCase()]) {
            console.log('Setting environment::', matches[2]);
            CurrentEnv = matches[2].toUpperCase();
            console.log('Curr Env::', CurrentEnv);
          }
        }

        return {
          isHTML: queryObj.html5 === 'true',
          serverBase,
          userToken: queryObj.tdLauncherUserToken,
        };
      }
    }
  }
  return { isHTML: false };
}

export default {
  parseCommandLine,
  getBaseURL,
  getLoginURL,
  getCurrentEnvironment,
  loadEnvironmentVariables,
  AppProtocol: config.AppProtocol,
};
