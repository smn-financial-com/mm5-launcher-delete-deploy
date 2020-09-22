import { remote, ipcRenderer } from 'electron';
import jre from 'node-jre';
import fs from 'fs';
import os from 'os';
import childProcess from 'child_process';
import log from 'electron-log';
import path from 'path';

process.once('loaded', () => {
  window.NativeLauncher = {
    notifyLoginComplete: (token, isHtml) => {
      ipcRenderer.send('notifyLoginComplete', { token, isHtml });
    },
  };
  window.getApp = () => {
    return remote.getGlobal('app');
  };
  window.fs = fs;
  window.os = os;
  window.childProcess = childProcess;
  window.ipcRenderer = ipcRenderer;
  window.jre = jre;

  rendererErrorHandling();
  log.transports.file.resolvePath = () => {
    const filePath = path.join(remote.getGlobal('app').getPath('userData'), 'logs', 'main.log');
    return filePath;
  };
  window.logger = log.functions;
  window.lang = remote.getGlobal('lang');

  ipcRenderer.on('clearStorage', () => {
    console.log('Clearing session');
    localStorage['auth.session'] = null;
  });
});

function rendererErrorHandling() {
  const onRendererError = (event) => {
    event.preventDefault();
    onApplicationError(event.error);
  };
  const onRendererRejection = (event) => {
    event.preventDefault();
    onApplicationError(event.reason);
  };

  const onApplicationError = (error) => {
    ipcRenderer.send('error', { error, name: error.name });
  };
  if (process.type === 'renderer') {
    window.addEventListener('error', onRendererError);
    window.addEventListener('unhandledrejection', onRendererRejection);
  }
}
