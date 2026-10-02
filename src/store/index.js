import Vue from 'vue';
import Vuex from 'vuex';

import products from './modules/products';
import pos from './modules/pos';
import sales from './modules/sales';
import auth from './modules/auth';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    products,
    pos,
    sales,
    auth
  },
  strict: process.env.NODE_ENV !== 'production'
});
