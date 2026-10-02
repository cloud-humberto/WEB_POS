<template>
  <div class="product-catalog-card">
    <div class="catalog-header">
      <div class="header-title mono">
        <span>CATALOG ITEMS</span>
        <span class="items-count">[{{ filteredProducts.length }}]</span>
      </div>

      <!-- Category Filter Tabs -->
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="cat-tab mono"
          :class="{ active: selectedCategory === cat }"
          @click="setCategory(cat)"
        >
          {{ cat.toUpperCase() }}
        </button>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="products-grid">
      <button
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-card"
        :class="{ 'out-of-stock': product.stock <= 0 }"
        :disabled="product.stock <= 0"
        @click="handleSelect(product)"
      >
        <div class="card-meta">
          <span class="product-code mono">{{ product.barcode.slice(-6) }}</span>
          <span 
            class="stock-badge mono" 
            :class="product.stock > 10 ? 'in-stock' : (product.stock > 0 ? 'low-stock' : 'no-stock')"
          >
            {{ product.stock }} {{ product.unit }}
          </span>
        </div>

        <div class="product-info">
          <div class="product-name" :title="product.name">{{ product.name }}</div>
          <div class="product-category mono">{{ product.category }}</div>
        </div>

        <div class="card-footer">
          <span class="product-price mono">{{ formatPrice(product.price) }}</span>
          <span class="add-btn mono">+ ADD</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { formatCurrency } from '@/utils/formatters';
import { playBeep, playError } from '@/utils/audio';

export default {
  name: 'ProductCatalog',
  computed: {
    ...mapGetters('products', ['categories', 'selectedCategory', 'filteredProducts'])
  },
  methods: {
    ...mapActions('products', ['setCategory']),
    ...mapActions('pos', ['addItem']),

    formatPrice(val) {
      return formatCurrency(val);
    },

    handleSelect(product) {
      if (product.stock <= 0) {
        playError();
        return;
      }
      try {
        this.addItem({ product, qty: 1 });
        playBeep();
        this.$emit('item-picked', product);
      } catch (err) {
        playError();
      }
    }
  }
};
</script>

<style scoped>
.product-catalog-card {
  background-color: #ffffff;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-xs);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.items-count {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.category-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
}

.cat-tab {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.cat-tab:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

.cat-tab.active {
  background-color: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
  flex: 1;
}

.product-card {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-xs);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  height: 105px;
  transition: all 0.1s ease;
}

.product-card:hover:not(:disabled) {
  border-color: #0284c7;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.product-card.out-of-stock {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f1f5f9;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.65rem;
}

.product-code {
  color: #64748b;
}

.stock-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 2px;
}
.stock-badge.in-stock { background: #dcfce7; color: #15803d; }
.stock-badge.low-stock { background: #fef3c7; color: #b45309; }
.stock-badge.no-stock { background: #fee2e2; color: #b91c1c; }

.product-info {
  margin: 4px 0;
}

.product-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-category {
  font-size: 0.62rem;
  color: #94a3b8;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
}

.product-price {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f172a;
}

.add-btn {
  font-size: 0.65rem;
  font-weight: 700;
  color: #0284c7;
}
</style>
