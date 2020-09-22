import props from './constants';
import axios from 'axios';
import path from 'path';
import url from 'url';
import http from 'https';
import LauncherError from '../LauncherError';

//constants
let jarsAppDir, clientJarPath, miscJarsPath;
let java = path.join(props.jrePath, 'javaw.exe');

function setPathVariables() {
  jarsAppDir = path.join(getApp().getPath('userData'), 'mm2', 'jars');
  clientJarPath = path.join(jarsAppDir, props.jarFile.client.name);
  miscJarsPath = Object.entries(props.jarFile)
    .filter((item) => item[0] !== 'client')
    .map((item) => path.join(jarsAppDir, item[1].name));
}

function getJavaPath(jreDIR) {
  window.logger.info('getJavaPath::', jreDIR);
  const jreDIRS = window.fs
    .readdirSync(jreDIR)
    .filter((file) => window.fs.statSync(path.join(jreDIR, file)).isDirectory());
  window.logger.info('getJavaPath::jreDIRS', jreDIRS);
  if (jreDIRS.length) {
    const exePath = getJavaExePath().slice();
    exePath.unshift(jreDIRS[0]);
    exePath.unshift(jreDIR);

    return path.join.apply(path, exePath);
  }
  throw new LauncherError('No JRE found');
}

function getJavaExePath() {
  return isMac() ? ['Contents', 'Home', 'bin', 'java'] : ['bin', 'javaw.exe'];
}

function getApp() {
  return window.getApp();
}

function loadJava() {
  return new Promise((resolve) => {
    if (process.env.NODE_ENV !== 'production') {
      const jreDIR = path.join(getApp().getAppPath(), 'jre');
      if (!window.fs.existsSync(jreDIR)) {
        window.logger.info('JRE not found. Installing JRE...', jreDIR);

        window.jre.install((err) => {
          if (!err) {
            java = getJavaPath(jreDIR);
            resolve();
          } else {
            window.logger.error(err);
          }
        });
      } else {
        java = getJavaPath(jreDIR);
        resolve();
      }
    } else {
      const resourcesDIR = getResourcesDir();
      const jreDIR = path.join(resourcesDIR, 'jre');
      window.logger.info('Resolved jreDir:', jreDIR);
      java = getJavaPath(jreDIR);
      resolve();
    }
  });
}

function isMac() {
  return window.os.platform() === 'darwin';
}

function getResourcesDir() {
  const exe = getApp().getPath('exe');
  window.logger.info('App EXE Path:', exe);
  window.logger.info('App UserData:', getApp().getPath('userData'));
  const exeDir = dirname(exe);
  if (isMac()) {
    return path.join(exeDir, '../Resources');
  } else {
    return path.join(exeDir, 'resources');
  }
}

function readServerSettings(baseUrl, lang) {
  const settingsUrl = url.resolve(baseUrl, `${props.restURL.settings}/${lang || 'en'}`);
  return axios
    .get(settingsUrl)
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      console.error('settings error', err);
      return {};
    });
}

async function notifyLoginComplete(baseURL, userToken, progress) {
  await loadJava();
  window.logger.info('Java set in the path::', java);
  //poll session id
  const isLoginUrl = url.resolve(baseURL, path.join(props.restURL.isLogin, userToken));
  pollRestURL(isLoginUrl)
    .then((data) => {
      if (data.sessionId) {
        window.logger.info('Received SessionId successfully::', data.sessionId);
        launchJarFile(baseURL, data.sessionId, userToken, progress);
      } else {
        window.logger.error('Received unknown data for polling::', data);
        throw new LauncherError('invalidSession');
      }
    })
    .catch((err) => {
      //display error page
      window.logger.error('Error when polling for sessionId', err);
      throw new LauncherError('invalidSesion');
    });
}

function pollRestURL(pollUrl, successCallback, noOfAttempts = 20, intervalMillis = 1000) {
  let counter = 1;
  const delay = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, intervalMillis);
    });
  };
  const pollFn = () => {
    window.logger.info('Poll URL %s attempt %s', pollUrl, counter);
    return axios.get(pollUrl).then((response) => {
      const success = successCallback ? successCallback(response) : response.status === 200;
      if (success) {
        return response.data;
      } else {
        if (++counter <= noOfAttempts) {
          return delay().then(pollFn);
        } else {
          throw new Error('Failure in fetching the results');
        }
      }
    });
  };

  return pollFn();
}

function launchJarFile(baseURL, sessionId, token, progress) {
  window.logger.info('Launching Jar File:', baseURL, sessionId, token);
  setPathVariables();
  ensureDir(jarsAppDir);
  validateClientJars(baseURL)
    .then((valid) => {
      if (valid) {
        launchClientJar(baseURL, token);
        if (progress) progress(100);
      } else {
        window.logger.info('version check failed. downloading jars....');
        //download the latest jars
        asyncDownloadAllJars(baseURL, progress)
          .then(() => {
            launchClientJar(baseURL, token);
            if (progress) progress(100);
          })
          .catch(() => {
            throw new LauncherError('launchFailure');
          });
      }
    })
    .catch((err) => {
      throw err;
    });
}

function ensureDir(dir) {
  try {
    window.fs.accessSync(dir);
    window.logger.info('File already exist::', dir);
  } catch (err) {
    window.logger.error('File not exist::', err);
    window.logger.info('Creating directory::', dir);
    let result = window.fs.mkdirSync(dir, { recursive: true });
    window.logger.info('mkdir result:', result);
  }
}

async function validateClientJars(baseURL) {
  window.logger.info('Checking current jars validity..');
  const allJarsExist =
    window.fs.existsSync(clientJarPath) && miscJarsPath.every((jarFile) => window.fs.existsSync(jarFile));
  if (!allJarsExist) return false;

  //Check the JAR version now
  const clientJarVersion = getClientJarVersion();
  if (!clientJarVersion) return false;
  return await getServerJarVersion(baseURL).then((serverJarVersion) => {
    if (!serverJarVersion || serverJarVersion.trim() === clientJarVersion.trim()) {
      window.logger.info('client and server jar version matched:', clientJarVersion, serverJarVersion);
      return true;
    } else {
      return false;
    }
  });
}

function asyncDownloadAllJars(baseURL, progress) {
  const miscJarsURLPath = Object.entries(props.jarFile)
    .filter((item) => item[0] !== 'client')
    .map((item) => url.resolve(baseURL, item[1].urlPath));
  const clientJarURLPath = url.resolve(baseURL, props.jarFile.client.urlPath);

  const downloadPromises = miscJarsURLPath.map((urlPath) => {
    const jarName = urlPath.substring(urlPath.lastIndexOf('/') + 1);
    const jarPath = miscJarsPath.find((path) => path.endsWith(jarName));
    return asyncDownloadFile(urlPath, jarPath);
  });

  return Promise.all(downloadPromises)
    .then(() => {
      window.logger.info('All misc jars downloaded successfully. Downloading client jar with feedback...');
      return asyncDownloadFile(clientJarURLPath, clientJarPath, progress);
    })
    .catch((err) => {
      window.logger.error('Failure in downloading misc jars...', err);
      return asyncDownloadFile(clientJarURLPath, clientJarPath, progress);
    });
}

async function asyncDownloadFile(fileURL, destPath, progress) {
  const writer = window.fs.createWriteStream(destPath);
  const uri = url.parse(fileURL);
  window.logger.info('Downloading file (http): ', fileURL + '(' + uri + ')' + ' ====> ' + destPath);

  return new Promise(function (resolve, reject) {
    http.get(uri.href).on('response', function (res) {
      const len = parseInt(res.headers['content-length'], 10);
      let downloaded = 0;
      let percent = 0;
      res
        .on('data', function (chunk) {
          writer.write(chunk);
          downloaded += chunk.length;
          percent = ((100.0 * downloaded) / len).toFixed(2);
          if (progress) progress(percent);
        })
        .on('end', function () {
          writer.end();
          window.logger.info(`${fileURL} downloaded to: ${destPath}`);
          resolve();
        })
        .on('error', function (err) {
          window.logger.error('download error:', err);
          reject(err);
        });
    });
  });
}

function launchClientJar(baseURL, userToken) {
  window.logger.info('version check success. proceeding with jar launch...', clientJarPath);
  if (window.fs.existsSync(clientJarPath)) {
    const delimiter = isMac() ? ':' : ';';
    const allJars = [clientJarPath, ...miscJarsPath].join(delimiter);
    window.logger.info('all jars:', allJars);
    window.logger.info('Executing main app::', baseURL, userToken);
    try {
      window.childProcess.exec(
        `"${java}" -Xmx1g -Xms256m -cp "${allJars}" com.financial.dcts.boot.AdvancedDashboard ${baseURL} ${userToken}`
      );
      checkLaunchAndQuit(baseURL, userToken);
    } catch {
      throw new LauncherError('launchFailure');
    }
  }
}

function checkLaunchAndQuit(baseURL, userToken) {
  const isLaunched = url.resolve(baseURL, path.join(props.restURL.isLaunched, userToken));
  const callback = (response) => {
    return response.data && response.data.ApplicationLaunched;
  };
  pollRestURL(isLaunched, callback)
    .then((data) => {
      if (data && data.ApplicationLaunched) {
        window.logger.info('App launched successfully. Quitting App...');
        getApp().quit();
      }
    })
    .catch((err) => window.logger.error('isLaunch error:', err));
}

function getClientJarVersion() {
  const isProd = process.env.NODE_ENV === 'production';

  let versionJar;
  if (isProd) {
    const resourcesDIR = getResourcesDir();
    versionJar = path.join(resourcesDIR, 'mm2/queryversion.jar');
  } else {
    versionJar = path.join(getApp().getAppPath(), '../src/mm2/resources/queryversion.jar');
  }
  window.logger.info('Version jar path::', versionJar);
  const version = window.childProcess.execSync(`"${java}" -jar "${versionJar}" "${clientJarPath}"`, {
    encoding: 'utf8',
  });

  return version;
}

async function getServerJarVersion(baseURL) {
  const jarVersionURL = url.resolve(baseURL, props.restURL.clientVersion);
  return await axios.get(jarVersionURL).then((response) => response.data.version);
}

function dirname(file) {
  if (!isMac()) {
    //FIXME: workaround to fix the backslash escape bug in windows platform
    let stringified = JSON.stringify(file);
    stringified = stringified.substring(1, stringified.lastIndexOf('\\') - 1);
    return stringified;
  }
  return path.dirname(file);
}

export default {
  loadJava,
  readServerSettings,
  pollRestURL,
  asyncDownloadFile,
  notifyLoginComplete,
};
