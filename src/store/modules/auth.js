const DEFAULT_USERS = [
  {
    id: 1,
    badge_code: 'BADGE-9001',
    username: 'admin',
    name: 'STORE MANAGER',
    pin: '1234',
    role: 'admin',
    maxDiscount: 50 // 50% discount allowance
  },
  {
    id: 2,
    badge_code: 'BADGE-1002',
    username: 'clerk',
    name: 'CASHIER OPERATOR',
    pin: '0000',
    role: 'cashier',
    maxDiscount: 10 // 10% max discount allowance
  }
];

export default {
  namespaced: true,
  state: () => ({
    users: JSON.parse(localStorage.getItem('novapos_users')) || DEFAULT_USERS,
    currentUser: JSON.parse(localStorage.getItem('novapos_current_user')) || null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.currentUser),
    currentUser: (state) => state.currentUser,
    userRole: (state) => state.currentUser?.role || 'guest',
    userName: (state) => state.currentUser?.name || 'Unauthenticated',
    
    isAdmin: (state) => state.currentUser?.role === 'admin',
    isCashier: (state) => state.currentUser?.role === 'cashier',
    
    canManageProducts: (state) => state.currentUser?.role === 'admin',
    canManageUsers: (state) => state.currentUser?.role === 'admin',
    
    maxDiscountPercent: (state) => {
      if (!state.currentUser) return 0;
      return state.currentUser.role === 'admin' ? 50 : 10;
    },

    allUsers: (state) => state.users
  },
  mutations: {
    SET_USERS(state, users) {
      state.users = users;
      localStorage.setItem('novapos_users', JSON.stringify(users));
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user;
      if (user) {
        localStorage.setItem('novapos_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('novapos_current_user');
      }
    },
    ADD_USER(state, newUser) {
      state.users.push(newUser);
      localStorage.setItem('novapos_users', JSON.stringify(state.users));
    },
    DELETE_USER(state, userId) {
      state.users = state.users.filter(u => u.id !== userId && u.username !== userId);
      localStorage.setItem('novapos_users', JSON.stringify(state.users));
      if (state.currentUser && (state.currentUser.id === userId || state.currentUser.username === userId)) {
        state.currentUser = null;
        localStorage.removeItem('novapos_current_user');
      }
    }
  },
  actions: {
    async fetchUsers({ commit }) {
      try {
        const { api } = await import('@/services/api');
        const users = await api.getUsers();
        if (Array.isArray(users)) {
          commit('SET_USERS', users);
          return users;
        }
      } catch (err) {
        console.warn('Backend fetchUsers error:', err.message);
      }
    },

    async loginWithBackend({ commit, dispatch }, { identifier, pin }) {
      try {
        const { api } = await import('@/services/api');
        const res = await api.login({ identifier, pin });
        if (res && res.user) {
          commit('SET_CURRENT_USER', res.user);
          return res.user;
        }
      } catch (err) {
        // If SQL server error or network, fallback to local lookup
        console.warn('Backend login error, attempting local validation fallback:', err.message);
        return dispatch('login', { username: identifier, pin });
      }
    },

    login({ commit, state }, { username, pin }) {
      const cleanId = String(username).trim().toLowerCase();
      const user = state.users.find(
        u => (u.username.toLowerCase() === cleanId || 
              (u.badge_code && u.badge_code.toLowerCase() === cleanId) ||
              String(u.id) === cleanId) &&
             u.pin === String(pin).trim()
      );

      if (!user) {
        throw new Error('Invalid employee username or PIN.');
      }

      commit('SET_CURRENT_USER', user);
      return user;
    },

    logout({ commit }) {
      commit('SET_CURRENT_USER', null);
    },

    async createUser({ commit, getters }, userData) {
      if (!getters.canManageUsers) {
        throw new Error('Permission denied. Admin role required.');
      }
      try {
        const { api } = await import('@/services/api');
        const res = await api.createUser(userData);
        if (res && res.success) {
          const newUser = {
            id: res.id,
            username: res.username,
            name: res.name,
            role: res.role,
            pin: userData.pin,
            max_discount: res.max_discount
          };
          commit('ADD_USER', newUser);
          return newUser;
        }
      } catch (err) {
        console.warn('Backend createUser fallback to local:', err.message);
      }
      const localUser = {
        id: Date.now(),
        ...userData
      };
      commit('ADD_USER', localUser);
      return localUser;
    },

    async deleteUser({ commit, getters }, userId) {
      if (!getters.canManageUsers) {
        throw new Error('Permission denied. Admin role required.');
      }
      try {
        const { api } = await import('@/services/api');
        await api.deleteUser(userId);
      } catch (err) {
        console.warn('Backend deleteUser fallback to local:', err.message);
      }
      commit('DELETE_USER', userId);
    }
  }
};
