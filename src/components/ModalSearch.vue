<template>
  <div class="modal-overlay" @keydown.esc="$emit('close')">
    <div class="modal-container search-modal">
      <div class="modal-header">
        <div class="modal-title mono">
          <h3>PRODUCT LOOKUP</h3>
          <span class="modal-subtitle">SEARCH INVENTORY BY NAME, SKU, OR BARCODE</span>
        </div>

        <button type="button" class="btn-modal-close mono" @click="$emit('close')">[ESC]</button>
      </div>

      <div class="modal-search-bar">
        <span class="prompt-sym mono">&gt;</span>
        <input
          ref="searchInput"
          v-model="localQuery"
          type="text"
          class="search-input mono"
          placeholder="Type search query (e.g. Coke, Bread, Water, Chips)..."
          @input="onSearchChange"
        />
        <span v-if="localQuery" class="clear-btn mono" @click="localQuery = ''; onSearchChange()">[CLEAR]</span>
      </div>

      <div class="modal-table-wrap">
        <table class="products-table mono">
          <thead>
            <tr>
              <th>BARCODE / SKU</th>
              <th>DESCRIPTION</th>
              <th>CATEGORY</th>
              <th>STOCK</th>
              <th class="text-right">PRICE</th>
              <th class="text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="no-results">
                No items matching "{{ localQuery }}".
              </td>
            </tr>
            <tr 
              v-for="product in filteredProducts" 
              :key="product.id"
              class="table-row"
              :class="{ 'row-no-stock': product.stock <= 0 }"
              @click="selectProduct(product)"
            >
              <td class="code-cell">{{ product.barcode }}</td>
              <td class="name-cell">
                <span class="p-title">{{ product.name }}</span>
              </td>
              <td>
                <span class="category-pill">{{ product.category }}</span>
              </td>
              <td>
                <span 
                  class="stock-tag"
                  :class="product.stock > 10 ? 'in' : (product.stock > 0 ? 'low' : 'out')"
                >
                  {{ product.stock }} {{ product.unit }}
                </span>
              </td>
              <td class="text-right price-cell">
                {{ formatMoney(product.price) }}
              </td>
              <td class="text-center">
                <button 
                  type="button" 
                  class="btn-table-add mono"
                  :disabled="product.stock <= 0"
                  @click.stop="selectProduct(product)"
                >
                  + SELECT
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer mono">
        <span class="footer-tip">TIP: Click or press Enter to add item to current transaction.</span>
        <button type="button" class="btn-cancel" @click="$emit('close')">
          [ESC] CLOSE
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { formatCurrency } from '@/utils/formatters';
import { playBeep, playError } from '@/utils/audio';

export default {
  name: 'ModalSearch',
  data() {
    return {
      localQuery: ''
    };
  },
  computed: {
    ...mapGetters('products', ['filteredProducts'])
  },
  methods: {
    ...mapActions('products', ['setSearchQuery']),
    ...mapActions('pos', ['addItem']),

    formatMoney(val) {
      return formatCurrency(val);
    },

    onSearchChange() {
      this.setSearchQuery(this.localQuery);
    },

    selectProduct(product) {
      if (product.stock <= 0) {
        playError();
        return;
      }
      try {
        this.addItem({ product, qty: 1 });
        playBeep();
        this.$emit('close');
      } catch (e) {
        playError();
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.searchInput) {
        this.$refs.searchInput.focus();
      }
    });
  }
};
</script>

<style scoped>
.search-modal {
  width: 760px;
}

.modal-header {
  padding: 10px 16px;
  background-color: #0f172a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title h3 {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.modal-subtitle {
  font-size: 0.65rem;
  color: #94a3b8;
}

.btn-modal-close {
  background: none;
  border: 1px solid #334155;
  color: #94a3b8;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 2px 6px;
}

.modal-search-bar {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-bottom: 2px solid #0f172a;
  padding: 8px 14px;
  gap: 10px;
}

.prompt-sym {
  font-size: 1rem;
  font-weight: 800;
  color: #64748b;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.clear-btn {
  cursor: pointer;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.modal-table-wrap {
  max-height: 400px;
  overflow-y: auto;
  background: #ffffff;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.products-table th {
  background-color: #f1f5f9;
  padding: 8px 12px;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #cbd5e1;
}

.table-row {
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
}

.table-row:hover {
  background-color: #f8fafc;
}

.table-row.row-no-stock {
  opacity: 0.45;
  cursor: not-allowed;
}

.products-table td {
  padding: 8px 12px;
  color: #0f172a;
}

.code-cell {
  font-size: 0.72rem;
  color: #64748b;
}

.name-cell {
  font-weight: 700;
}

.category-pill {
  background: #f1f5f9;
  padding: 1px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 2px;
  font-size: 0.68rem;
  color: #475569;
}

.stock-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 2px;
}
.stock-tag.in { background: #dcfce7; color: #15803d; }
.stock-tag.low { background: #fef3c7; color: #b45309; }
.stock-tag.out { background: #fee2e2; color: #b91c1c; }

.price-cell {
  font-weight: 800;
  color: #0f172a;
}

.btn-table-add {
  background: #0f172a;
  border: none;
  color: #fff;
  padding: 4px 8px;
  border-radius: 2px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-table-add:hover:not(:disabled) {
  background: #334155;
}

.btn-table-add:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.text-right { text-align: right; }
.text-center { text-align: center; }

.no-results {
  text-align: center;
  padding: 30px;
  color: #64748b;
}

.modal-footer {
  padding: 10px 16px;
  background-color: #f8fafc;
  border-top: 1px solid var(--border-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-tip {
  font-size: 0.7rem;
  color: #64748b;
}

.btn-cancel {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 700;
}
</style>
