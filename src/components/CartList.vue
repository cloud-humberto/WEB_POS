<template>
  <div class="cart-container">
    <div class="cart-header">
      <div class="cupom-title mono">
        <h3>CURRENT ORDER TAPE</h3>
        <span class="cupom-sub">TICKET #{{ saleNumber }}</span>
      </div>

      <span class="items-badge mono">
        {{ itemCount }} {{ itemCount === 1 ? 'ITEM' : 'ITEMS' }}
      </span>
    </div>

    <!-- Items List -->
    <div ref="itemsScroll" class="cart-items-wrapper">
      <div v-if="cartItems.length === 0" class="cart-empty mono">
        <div class="empty-code">--- REGISTER IDLE ---</div>
        <p>No items in current transaction.</p>
        <span class="empty-tip">Scan barcode or press [F2] to search.</span>
      </div>

      <div v-else class="items-list">
        <div
          v-for="(item, index) in cartItems"
          :key="item.id"
          class="cart-row"
        >
          <div class="item-seq mono">{{ String(index + 1).padStart(2, '0') }}</div>

          <div class="item-main-info">
            <div class="item-name-line">
              <span class="item-title">{{ item.name }}</span>
              <span class="item-code mono">{{ item.barcode }}</span>
            </div>

            <div class="item-qty-price mono">
              <div class="qty-stepper">
                <button 
                  type="button" 
                  class="btn-step" 
                  @click="decreaseQty(item)"
                  title="Decrease quantity"
                >-</button>
                <span class="qty-val">{{ item.qty }} {{ item.unit }}</span>
                <button 
                  type="button" 
                  class="btn-step" 
                  @click="increaseQty(item)"
                  title="Increase quantity"
                >+</button>
              </div>

              <span class="unit-price">
                @ {{ formatMoney(item.price) }}
              </span>

              <span v-if="item.discount > 0" class="item-discount-tag">
                -{{ formatMoney(item.discount) }} DISC
              </span>
            </div>
          </div>

          <div class="item-total-col">
            <span class="item-total-value mono">{{ formatMoney(item.total) }}</span>

            <!-- Scoped Slot -->
            <slot name="item-actions" :item="item">
              <div class="default-actions">
                <button 
                  type="button" 
                  class="btn-action-text mono" 
                  @click="promptItemDiscount(item)"
                  title="Add item discount"
                >
                  DISC
                </button>
                <button 
                  type="button" 
                  class="btn-action-text del mono" 
                  @click="removeItem(item.id)"
                  title="Void line item"
                >
                  DEL
                </button>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { formatCurrency } from '@/utils/formatters';

export default {
  name: 'CartList',
  computed: {
    ...mapGetters('pos', ['cartItems', 'saleNumber', 'itemCount']),
    ...mapGetters('auth', ['maxDiscountPercent', 'userRole'])
  },
  watch: {
    'cartItems.length': function() {
      this.$nextTick(() => {
        const el = this.$refs.itemsScroll;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  },
  methods: {
    ...mapActions('pos', ['removeItem', 'updateQty']),

    formatMoney(val) {
      return formatCurrency(val);
    },

    increaseQty(item) {
      this.updateQty({ itemId: item.id, newQty: item.qty + 1 });
    },

    decreaseQty(item) {
      if (item.qty > 1) {
        this.updateQty({ itemId: item.id, newQty: item.qty - 1 });
      } else {
        this.removeItem(item.id);
      }
    },

    promptItemDiscount(item) {
      const current = item.discount || 0;
      const allowedMax = this.maxDiscountPercent || 10;
      const maxItemDiscount = (item.price * item.qty * allowedMax) / 100;

      const input = prompt(`Line discount in $ for "${item.name}" (Max ${allowedMax}% = $${maxItemDiscount.toFixed(2)}):`, current);
      if (input !== null) {
        const val = parseFloat(input.replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
          if (val > maxItemDiscount) {
            alert(`Permission Denied: Line discount cannot exceed ${allowedMax}% ($${maxItemDiscount.toFixed(2)}) for role ${this.userRole.toUpperCase()}. Manager authorization required.`);
            return;
          }
          this.$store.commit('pos/APPLY_ITEM_DISCOUNT', {
            itemId: item.id,
            discount: val
          });
        }
      }
    }
  }
};
</script>

<style scoped>
.cart-container {
  background-color: #ffffff;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-xs);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.cart-header {
  padding: 10px 14px;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cupom-title h3 {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.cupom-sub {
  font-size: 0.68rem;
  color: #94a3b8;
}

.items-badge {
  font-size: 0.72rem;
  font-weight: 700;
  background: #334155;
  color: #38bdf8;
  padding: 2px 8px;
  border-radius: 2px;
}

.cart-items-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafc;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  text-align: center;
  padding: 30px;
}

.empty-code {
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 6px;
}

.cart-empty p {
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 0.72rem;
  color: #475569;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cart-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-xs);
  padding: 6px 10px;
}

.item-seq {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 4px;
  border: 1px solid #e2e8f0;
}

.item-main-info {
  flex: 1;
  min-width: 0;
}

.item-name-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.item-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-code {
  font-size: 0.65rem;
  color: #94a3b8;
}

.item-qty-price {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  margin-top: 2px;
}

.qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.btn-step {
  background: transparent;
  border: none;
  color: #0f172a;
  width: 18px;
  height: 18px;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.75rem;
}

.btn-step:hover {
  background: #e2e8f0;
}

.qty-val {
  padding: 0 5px;
  font-weight: 700;
  color: #0f172a;
}

.unit-price {
  color: #64748b;
}

.item-discount-tag {
  color: #b45309;
  background: #fef3c7;
  padding: 1px 4px;
  font-size: 0.65rem;
  font-weight: 700;
}

.item-total-col {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.item-total-value {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.default-actions {
  display: flex;
  gap: 3px;
}

.btn-action-text {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 1px 4px;
  font-size: 0.62rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-action-text:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-action-text.del {
  color: #b91c1c;
}
.btn-action-text.del:hover {
  background: #fee2e2;
}
</style>
