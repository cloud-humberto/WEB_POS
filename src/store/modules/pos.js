import Vue from 'vue';

export default {
  namespaced: true,
  state: () => ({
    cart: [],
    saleNumber: Number(localStorage.getItem('novapos_sale_seq')) || 1042,
    operator: 'Humberto',
    posStation: '01',
    isOpen: true,
    customer: {
      name: '',
      phone: ''
    },
    taxRate: 0.08, // 8.0% standard retail sales tax
    globalDiscount: {
      type: 'value', // 'value' | 'percent'
      amount: 0
    }
  }),
  getters: {
    cartItems: (state) => state.cart,
    saleNumber: (state) => state.saleNumber,
    operator: (state) => state.operator,
    posStation: (state) => state.posStation,
    customer: (state) => state.customer,
    taxRate: (state) => state.taxRate,
    globalDiscount: (state) => state.globalDiscount,
    
    itemCount: (state) => {
      return state.cart.reduce((acc, item) => acc + item.qty, 0);
    },

    subtotal: (state) => {
      return state.cart.reduce((acc, item) => {
        const itemSubtotal = item.price * item.qty;
        const itemDiscount = item.discount || 0;
        return acc + Math.max(0, itemSubtotal - itemDiscount);
      }, 0);
    },

    discountTotal: (state, getters) => {
      const sub = getters.subtotal;
      if (state.globalDiscount.type === 'percent') {
        return (sub * (state.globalDiscount.amount || 0)) / 100;
      }
      return Number(state.globalDiscount.amount) || 0;
    },

    taxAmount: (state, getters) => {
      const taxable = Math.max(0, getters.subtotal - getters.discountTotal);
      return taxable * state.taxRate;
    },

    totalAmount: (state, getters) => {
      const total = getters.subtotal - getters.discountTotal + getters.taxAmount;
      return Math.max(0, total);
    },

    isCartEmpty: (state) => state.cart.length === 0
  },
  mutations: {
    ADD_ITEM(state, { product, qty = 1 }) {
      const existingIndex = state.cart.findIndex(i => i.productId === product.id);

      if (existingIndex !== -1) {
        const item = state.cart[existingIndex];
        const newQty = item.qty + qty;
        Vue.set(item, 'qty', newQty);
        Vue.set(item, 'total', (item.price * newQty) - (item.discount || 0));
      } else {
        const newItem = {
          id: Date.now() + Math.random(),
          itemNumber: state.cart.length + 1,
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          qty: qty,
          unit: product.unit || 'EA',
          discount: 0,
          total: product.price * qty
        };
        state.cart.push(newItem);
      }
    },

    UPDATE_ITEM_QTY(state, { itemId, qty }) {
      const item = state.cart.find(i => i.id === itemId);
      if (item) {
        const safeQty = Math.max(1, qty);
        Vue.set(item, 'qty', safeQty);
        Vue.set(item, 'total', (item.price * safeQty) - (item.discount || 0));
      }
    },

    APPLY_ITEM_DISCOUNT(state, { itemId, discount }) {
      const item = state.cart.find(i => i.id === itemId);
      if (item) {
        const safeDiscount = Math.min(item.price * item.qty, Math.max(0, Number(discount) || 0));
        Vue.set(item, 'discount', safeDiscount);
        Vue.set(item, 'total', (item.price * item.qty) - safeDiscount);
      }
    },

    REMOVE_ITEM(state, itemId) {
      state.cart = state.cart.filter(i => i.id !== itemId);
      state.cart.forEach((item, index) => {
        Vue.set(item, 'itemNumber', index + 1);
      });
    },

    CLEAR_CART(state) {
      state.cart = [];
      state.globalDiscount = { type: 'value', amount: 0 };
      state.customer = { name: '', phone: '' };
    },

    SET_CUSTOMER(state, payload) {
      state.customer = { ...state.customer, ...payload };
    },

    SET_GLOBAL_DISCOUNT(state, { type, amount }) {
      state.globalDiscount = {
        type: type || 'value',
        amount: Math.max(0, Number(amount) || 0)
      };
    },

    INCREMENT_SALE_SEQ(state) {
      state.saleNumber += 1;
      localStorage.setItem('novapos_sale_seq', state.saleNumber);
    }
  },
  actions: {
    addItem({ commit }, { product, qty = 1 }) {
      if (product.stock < qty) {
        throw new Error(`Insufficient stock. Available: ${product.stock} ${product.unit}`);
      }
      commit('ADD_ITEM', { product, qty });
      commit('products/DECREMENT_STOCK', { id: product.id, qty }, { root: true });
    },

    removeItem({ commit, state }, itemId) {
      const item = state.cart.find(i => i.id === itemId);
      if (item) {
        commit('products/RESTORE_STOCK', { id: item.productId, qty: item.qty }, { root: true });
        commit('REMOVE_ITEM', itemId);
      }
    },

    updateQty({ commit, state }, { itemId, newQty }) {
      const item = state.cart.find(i => i.id === itemId);
      if (!item) return;

      const diff = newQty - item.qty;
      if (diff > 0) {
        commit('products/DECREMENT_STOCK', { id: item.productId, qty: diff }, { root: true });
      } else if (diff < 0) {
        commit('products/RESTORE_STOCK', { id: item.productId, qty: Math.abs(diff) }, { root: true });
      }
      commit('UPDATE_ITEM_QTY', { itemId, qty: newQty });
    },

    cancelSale({ commit, state }) {
      state.cart.forEach(item => {
        commit('products/RESTORE_STOCK', { id: item.productId, qty: item.qty }, { root: true });
      });
      commit('CLEAR_CART');
    },

    async finishSale({ commit, state, getters, rootGetters }, paymentInfo) {
      const currentUser = rootGetters['auth/currentUser'];
      const completedSale = {
        id: Date.now(),
        saleNumber: state.saleNumber,
        timestamp: new Date().toISOString(),
        operator: currentUser?.name || state.operator,
        posStation: state.posStation,
        customer: { ...state.customer },
        items: JSON.parse(JSON.stringify(state.cart)),
        subtotal: getters.subtotal,
        discountTotal: getters.discountTotal,
        taxAmount: getters.taxAmount,
        totalAmount: getters.totalAmount,
        payment: { ...paymentInfo }
      };

      // 1. Commit to local state and history
      commit('sales/ADD_COMPLETED_SALE', completedSale, { root: true });
      commit('INCREMENT_SALE_SEQ');
      commit('CLEAR_CART');

      // 2. Asynchronously send transaction to SQLite Backend
      try {
        const { api } = await import('@/services/api');
        api.createSale({
          sale_number: completedSale.saleNumber,
          user_id: currentUser?.id || null,
          operator_name: completedSale.operator,
          subtotal: completedSale.subtotal,
          discount_total: completedSale.discountTotal,
          tax_amount: completedSale.taxAmount,
          total_amount: completedSale.totalAmount,
          payment_method: paymentInfo.method,
          received_amount: paymentInfo.receivedAmount,
          change_amount: paymentInfo.change,
          items: completedSale.items
        }).catch(e => console.warn('Could not sync sale to SQLite server:', e.message));
      } catch (e) {
        // Silent catch for offline mode
      }

      return completedSale;
    }
  }
};
