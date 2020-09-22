import Vue from 'vue';
import Router from 'vue-router';
import Home from '../components/Home.vue';
import Landing from '../components/Landing.vue';
import Error from '../components/Error.vue';

Vue.use(Router);

export default new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/home',
      name: 'homeMsg',
      component: Home,
      props(route) {
        return {
          msg: route.query.msg,
        };
      },
    },
    {
      path: '/landing',
      name: 'landing',
      component: Landing,
      props(route) {
        return {
          baseURL: route.query.baseURL,
          userToken: route.query.userToken,
        };
      },
    },
    {
      path: '/error',
      name: 'error',
      component: Error,
      props(route) {
        return {
          error: route.query.msg,
        };
      },
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
