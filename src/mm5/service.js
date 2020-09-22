import axios from 'axios';
import loginUtil from '@/loginUtil';
import props from './constants';

export default {
  verifyLogin: function (sid) {
    const instance = axios.create({
      baseURL: props.DoryURL[loginUtil.getCurrentEnvironment()],
    });
    return new Promise((resolve, reject) => {
      instance
        .post('/tokens', null, {
          headers: {
            'Content-Type': 'application/json',
            sid,
          },
        })
        .then((response) => {
          console.log('DORY SID Response::', response.data);
          const jwt = response.data;
          instance
            .get('/userdata/usersettings/samlLogin', {
              headers: {
                jwt,
              },
            })
            .then((response) => {
              console.log('SAML Data::', response.data);
              const samlData = response.data.data;
              const cookie = {};
              if (samlData.session) {
                Object.keys(samlData.session).forEach((key) => {
                  if (key.startsWith('cookie')) {
                    let val = samlData.session[key];
                    const cookieObj = val.split('&').reduce((acc, v) => {
                      const cookie = v.split('=');
                      acc[cookie[0].toLowerCase()] = cookie[1];
                      return acc;
                    }, {});
                    cookie[key.substring(key.indexOf('|') + 1)] = cookieObj;
                  }
                });
              }
              resolve(cookie);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
