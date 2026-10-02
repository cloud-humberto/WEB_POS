export default {
  namespaced: true,
  state: () => ({
    history: JSON.parse(localStorage.getItem('novapos_sales_history')) || []
  }),
  getters: {
    allSales: (state) => state.history,
    
    todaySales: (state) => {
      const todayStr = new Date().toISOString().slice(0, 10);
      return state.history.filter(s => s.timestamp.startsWith(todayStr));
    },

    totalRevenueToday: (state, getters) => {
      return getters.todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    },

    totalOrdersToday: (state, getters) => {
      return getters.todaySales.length;
    },

    averageTicketToday: (state, getters) => {
      if (getters.totalOrdersToday === 0) return 0;
      return getters.totalRevenueToday / getters.totalOrdersToday;
    },

    salesByPaymentMethod: (state, getters) => {
      const summary = {
        cash: 0,
        credit: 0,
        debit: 0,
        gift_card: 0
      };

      getters.todaySales.forEach(s => {
        const method = s.payment?.method || 'cash';
        if (summary[method] !== undefined) {
          summary[method] += s.totalAmount;
        } else {
          summary[method] = (summary[method] || 0) + s.totalAmount;
        }
      });

      return summary;
    }
  },
  mutations: {
    ADD_COMPLETED_SALE(state, sale) {
      state.history.unshift(sale);
      localStorage.setItem('novapos_sales_history', JSON.stringify(state.history));
    },
    CLEAR_HISTORY(state) {
      state.history = [];
      localStorage.removeItem('novapos_sales_history');
    }
  },
  actions: {
    clearSalesHistory({ commit }) {
      commit('CLEAR_HISTORY');
    }
  }
};
