module.exports = {
  AppProtocol: 'advanceddashboardtd',
  AppData: 'financial/TD Advanced Dashboard',
  Env: process.env.VUE_APP_TD_ENVIRONMENT,
  TdLoginURL: {
    DEV:
      //'https://wb2.authentication.pat.td.com/uap-ui/index.html?consumer=webbroker&locale=en_CA&goto=https%3A%2F%2Fwebbroker2.pat.td.com%2Fwaw%2Fbrk%2Fwb%2Fwbr%2Fstatic%2Fad-launcher%2Findex.html',
      'https://authentication1.sys.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fwebbroker.delta.td.com%2Fwaw%2Fbrk%2Fwb%2Fwbr%2Fstatic%2Fad-launcher%2Findex.html',
    //'https://authentication1.sys.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fadvanceddashboard.dev.td.com%2Fmm5%2FtdLanding',
    SYS:
      'https://authentication1.sys.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fwebbroker.omega.td.com%2Fwaw%2Fbrk%2Fwb%2Fwbr%2Fstatic%2Fad-launcher%2Findex.html',
    //'https://authentication1.sys.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fadvanceddashboard.sys.td.com%2Fmm5%2FtdLanding',
    PAT:
      //'https://wb2.authentication.pat.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fwebbroker2.pat.td.com%2Fwaw%2Fbrk%2Fwb%2Fwbr%2Fstatic%2Fad-launcher%2Findex.html', //Not MM5 URL
      'https://wb2.authentication.pat.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fwebbroker2.pat.td.com%2Fwaw%2Fbrk%2Fwb%2Fwbr%2Fstatic%2Fad-launcher%2Findex.html',
    PROD:
      'https://authentication1.sys.td.com/uap-ui/index.html?consumer=advanceddashboard&locale=en_CA&goto=https%3A%2F%2Fadvanceddashboard.sys.td.com%2Fmm5%2FtdLanding',
    //https://wb.authentication.td.com/uap-ui/index.html?consumer=webbroker&locale=en_CA&goto=https://webbroker.td.com/waw/brk/wb/wbr/static/ad-launcher/index.html
  },
  BaseURL: {
    DEV: 'https://advanceddashboard.dev.td.com',
    SYS: 'https://advanceddashboard.sys.td.com',
    PAT: 'https://advanceddashboard.pat.td.com',
    PROD: 'https://advanceddashboard.td.com',
  },
  DoryURL: {
    DEV: 'https://td-mm5-int.financial.com/auth/api/v1',
    SYS: 'https://td-mm5-uat.financial.com/auth/api/v1',
    PAT: 'https://td-mm5-uat.financial.com/auth/api/v1',
    PROD: 'https://td-mm5-uat.financial.com/auth/api/v1',
  },
};
