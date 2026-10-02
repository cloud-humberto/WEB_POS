import Vue from 'vue';
import App from './App.vue';
import store from './store';
import { focusDirective } from './directives/focus';
import { permissionDirective } from './directives/permission';
import './assets/styles.css';

Vue.config.productionTip = false;

// Global custom directives
Vue.directive('focus', focusDirective);
Vue.directive('permission', permissionDirective);

// Initial database sync
store.dispatch('auth/fetchUsers');

new Vue({
  store,
  render: (h) => h(App)
}).$mount('#app');
