/**Temporary main file - for webpack dev server */

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import BootstrapVue from 'bootstrap-vue';
import VueI18n from 'vue-i18n';
import messages from './translations';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.use(VueI18n);
Vue.use(BootstrapVue);
Vue.config.productionTip = false;

const i18n = new VueI18n({
  locale: window.lang || 'en',
  messages,
  fallbackLocale: 'en',
  silentTranslationWarn: false,
});

new Vue({
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
