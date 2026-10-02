const INITIAL_PRODUCTS = [
  // Beverages
  { id: 1, name: 'Coca-Cola Classic 12oz Can', barcode: '049000028904', price: 1.75, stock: 48, category: 'Beverages', unit: 'EA' },
  { id: 2, name: 'Diet Coke 20oz Bottle', barcode: '049000000443', price: 2.25, stock: 36, category: 'Beverages', unit: 'EA' },
  { id: 3, name: 'Spring Water 16.9oz', barcode: '071142000018', price: 1.20, stock: 95, category: 'Beverages', unit: 'EA' },
  { id: 4, name: 'Red Bull Energy Drink 8.4oz', barcode: '611269000010', price: 3.50, stock: 30, category: 'Beverages', unit: 'EA' },
  { id: 5, name: 'Orange Juice 14oz Bottle', barcode: '025000044005', price: 2.80, stock: 24, category: 'Beverages', unit: 'EA' },
  { id: 6, name: 'Cold Brew Coffee 12oz', barcode: '852084004012', price: 3.95, stock: 20, category: 'Beverages', unit: 'EA' },

  // Bakery & Deli
  { id: 7, name: 'Artisan Baguette', barcode: '200000000001', price: 3.50, stock: 40, category: 'Bakery', unit: 'EA' },
  { id: 8, name: 'Ham & Cheddar Croissant', barcode: '200000000002', price: 5.75, stock: 18, category: 'Prepared Food', unit: 'EA' },
  { id: 9, name: 'Blueberry Muffin', barcode: '200000000003', price: 2.95, stock: 25, category: 'Bakery', unit: 'EA' },
  { id: 10, name: 'Classic Glazed Donut', barcode: '200000000004', price: 1.50, stock: 50, category: 'Bakery', unit: 'EA' },
  { id: 11, name: 'Chicken Club Sandwich', barcode: '200000000005', price: 7.50, stock: 15, category: 'Prepared Food', unit: 'EA' },

  // Snacks & Candy
  { id: 12, name: 'Potato Chips Sea Salt 5oz', barcode: '028400000012', price: 3.25, stock: 35, category: 'Snacks', unit: 'EA' },
  { id: 13, name: 'Milk Chocolate Bar 3.5oz', barcode: '034000002405', price: 2.10, stock: 60, category: 'Candy', unit: 'EA' },
  { id: 14, name: 'Chewy Granola Bar', barcode: '030000061203', price: 1.15, stock: 80, category: 'Snacks', unit: 'EA' },
  { id: 15, name: 'Peppermint Chewing Gum', barcode: '022000004455', price: 1.45, stock: 90, category: 'Candy', unit: 'EA' },
  { id: 16, name: 'Roasted Almonds 2.5oz', barcode: '041143000023', price: 4.25, stock: 28, category: 'Snacks', unit: 'EA' }
];

export default {
  namespaced: true,
  state: () => ({
    items: JSON.parse(localStorage.getItem('novapos_products')) || INITIAL_PRODUCTS,
    selectedCategory: 'All',
    searchQuery: ''
  }),
  getters: {
    allProducts: (state) => state.items,
    selectedCategory: (state) => state.selectedCategory,
    searchQuery: (state) => state.searchQuery,
    
    categories: (state) => {
      const cats = new Set(state.items.map(p => p.category));
      return ['All', ...Array.from(cats)];
    },

    filteredProducts: (state) => {
      const q = state.searchQuery.trim().toLowerCase();
      const cat = state.selectedCategory;

      return state.items.filter(product => {
        const matchesCategory = cat === 'All' || product.category === cat;
        const matchesSearch = !q || 
          product.name.toLowerCase().includes(q) || 
          product.barcode.includes(q) ||
          product.category.toLowerCase().includes(q);
        
        return matchesCategory && matchesSearch;
      });
    },

    findByBarcode: (state) => (code) => {
      const cleanCode = String(code).trim();
      return state.items.find(p => p.barcode === cleanCode || String(p.id) === cleanCode);
    },

    findById: (state) => (id) => {
      return state.items.find(p => p.id === Number(id));
    }
  },
  mutations: {
    SET_CATEGORY(state, category) {
      state.selectedCategory = category;
    },
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query;
    },
    DECREMENT_STOCK(state, { id, qty }) {
      const item = state.items.find(p => p.id === id);
      if (item) {
        item.stock = Math.max(0, item.stock - qty);
        localStorage.setItem('novapos_products', JSON.stringify(state.items));
      }
    },
    RESTORE_STOCK(state, { id, qty }) {
      const item = state.items.find(p => p.id === id);
      if (item) {
        item.stock += qty;
        localStorage.setItem('novapos_products', JSON.stringify(state.items));
      }
    },
    RESET_STOCK_DEFAULT(state) {
      state.items = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('novapos_products', JSON.stringify(state.items));
    },
    CREATE_PRODUCT(state, product) {
      state.items.unshift(product);
      localStorage.setItem('novapos_products', JSON.stringify(state.items));
    },
    DELETE_PRODUCT(state, productId) {
      state.items = state.items.filter(p => p.id !== productId);
      localStorage.setItem('novapos_products', JSON.stringify(state.items));
    }
  },
  actions: {
    setCategory({ commit }, category) {
      commit('SET_CATEGORY', category);
    },
    setSearchQuery({ commit }, query) {
      commit('SET_SEARCH_QUERY', query);
    },
    resetCatalog({ commit }) {
      commit('RESET_STOCK_DEFAULT');
    },
    createProduct({ commit, rootGetters }, productData) {
      if (!rootGetters['auth/canManageProducts']) {
        throw new Error('Unauthorized: Manager/Admin role required to add products.');
      }
      const newProduct = {
        id: Date.now(),
        ...productData
      };
      commit('CREATE_PRODUCT', newProduct);
      return newProduct;
    },
    deleteProduct({ commit, rootGetters }, productId) {
      if (!rootGetters['auth/canManageProducts']) {
        throw new Error('Unauthorized: Manager/Admin role required to delete products.');
      }
      commit('DELETE_PRODUCT', productId);
    }
  }
};
