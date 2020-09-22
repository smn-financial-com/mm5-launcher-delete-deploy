export default {
  windowsVersion: '2.0.3',
  macVersion: '2.0.4',
  jrePath: 'C:\\Program Files\\Java\\jdk1.8.0_171\\jre\\bin',
  jarFile: {
    client: { name: 'mm2tdFullClient.jar', urlPath: '/mm2tdClientFull/mm2td-client/mm2tdFullClient.jar' },
    font: { name: 'font-verdana.jar', urlPath: '/mm2tdClientV2/mm2td-client/font-verdana.jar' },
    skinWhite: { name: 'skin-td.jar', urlPath: '/mm2tdClientV2/mm2td-client/skin-td.jar' },
    skinBlack: { name: 'skin-tdblack.jar', urlPath: '/mm2tdClientV2/mm2td-client/skin-tdblack.jar' },
  },
  restURL: {
    settings: '/restService/ThickClient/settings/td',
    isLaunched: '/restService/ThickClient/isLaunched',
    isLogin: '/restService/ThickClient/isLogin',
    clientVersion: '/mm2tdClientFull/version',
  },
};
