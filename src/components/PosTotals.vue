<template>
  <div class="pos-totals-card">
    <!-- Customer Info & Global Discount -->
    <div class="customer-strip">
      <div class="customer-input-group">
        <span class="strip-label mono">CUST:</span>
        <input 
          v-model="customerPhone" 
          type="text" 
          class="phone-input mono" 
          placeholder="Customer Phone / Member ID (Optional)..."
          @input="handleCustomerInput"
        />
      </div>

      <button 
        type="button" 
        class="btn-discount-trigger mono"
        :class="{ active: globalDiscount.amount > 0 }"
        @click="openDiscountPrompt"
        title="Apply order discount"
      >
        <span v-if="globalDiscount.amount > 0">
          DISC: -{{ globalDiscount.type === 'percent' ? globalDiscount.amount + '%' : formatMoney(globalDiscount.amount) }}
        </span>
        <span v-else>+ ORDER DISCOUNT</span>
      </button>
    </div>

    <!-- Totals Breakdown -->
    <div class="totals-breakdown mono">
      <div class="total-row">
        <span class="label">SUBTOTAL:</span>
        <span class="val">{{ formatMoney(subtotal) }}</span>
      </div>

      <div v-if="discountTotal > 0" class="total-row discount-row">
        <span class="label">DISCOUNT:</span>
        <span class="val">-{{ formatMoney(discountTotal) }}</span>
      </div>

      <div class="total-row">
        <span class="label">SALES TAX (8.0%):</span>
        <span class="val">{{ formatMoney(taxAmount) }}</span>
      </div>
    </div>

    <!-- Prominent Total Due Box -->
    <div class="total-highlight-box">
      <div class="highlight-info mono">
        <span class="highlight-label">TOTAL DUE</span>
        <span class="highlight-sub">{{ itemCount }} ITEMS</span>
      </div>
      <div class="highlight-value mono">
        {{ formatMoney(totalAmount) }}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons-group">
      <button 
        type="button" 
        class="btn-action-cancel mono" 
        :disabled="isCartEmpty"
        @click="$emit('cancel-sale')"
      >
        <span class="btn-kbd">F8</span>
        <span>VOID SALE</span>
      </button>

      <button 
        type="button" 
        class="btn-action-pay mono" 
        :disabled="isCartEmpty"
        @click="$emit('open-checkout')"
      >
        <div class="pay-btn-content">
          <span class="btn-kbd pay">F4</span>
          <span class="pay-text">PAY / TENDER</span>
        </div>
        <span class="pay-amount">{{ formatMoney(totalAmount) }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { formatCurrency } from '@/utils/formatters';

export default {
  name: 'PosTotals',
  data() {
    return {
      customerPhone: ''
    };
  },
  computed: {
    ...mapGetters('pos', [
      'subtotal', 
      'discountTotal', 
      'taxAmount',
      'totalAmount', 
      'itemCount', 
      'isCartEmpty', 
      'globalDiscount',
      'customer'
    ]),
    ...mapGetters('auth', ['maxDiscountPercent', 'userRole'])
  },
  methods: {
    ...mapMutations('pos', ['SET_CUSTOMER', 'SET_GLOBAL_DISCOUNT']),

    formatMoney(val) {
      return formatCurrency(val);
    },

    handleCustomerInput(e) {
      this.customerPhone = e.target.value;
      this.SET_CUSTOMER({ phone: e.target.value });
    },

    openDiscountPrompt() {
      const allowedMax = this.maxDiscountPercent || 10;
      const resp = prompt(`Enter order discount (Max allowed for ${this.userRole.toUpperCase()}: ${allowedMax}%):`);
      if (resp !== null) {
        const clean = resp.trim();
        if (clean.endsWith('%')) {
          const num = parseFloat(clean.replace('%', '').trim());
          if (!isNaN(num) && num >= 0) {
            if (num > allowedMax) {
              alert(`Permission Denied: Your role (${this.userRole.toUpperCase()}) cannot grant more than ${allowedMax}% discount. Manager authorization required.`);
              return;
            }
            this.SET_GLOBAL_DISCOUNT({ type: 'percent', amount: num });
          }
        } else {
          const num = parseFloat(clean.replace(',', '.'));
          if (!isNaN(num) && num >= 0) {
            const calculatedPercent = this.subtotal > 0 ? (num / this.subtotal) * 100 : 0;
            if (calculatedPercent > allowedMax) {
              const maxDollar = ((this.subtotal * allowedMax) / 100).toFixed(2);
              alert(`Permission Denied: $${num.toFixed(2)} is ${calculatedPercent.toFixed(1)}% of subtotal. Your maximum discount allowance is ${allowedMax}% ($${maxDollar}).`);
              return;
            }
            this.SET_GLOBAL_DISCOUNT({ type: 'value', amount: num });
          }
        }
      }
    }
  }
};
</script>

<style scoped>
.pos-totals-card {
  background-color: #ffffff;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-xs);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.customer-strip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.customer-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-xs);
  padding: 4px 8px;
}

.strip-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  margin-right: 6px;
}

.phone-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #0f172a;
  font-size: 0.78rem;
}

.phone-input::placeholder {
  color: #94a3b8;
  font-family: var(--font-main);
}

.btn-discount-trigger {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--radius-xs);
}

.btn-discount-trigger:hover {
  background-color: #e2e8f0;
  color: #0f172a;
}

.btn-discount-trigger.active {
  background-color: #fef3c7;
  border-color: #fde68a;
  color: #92400e;
}

.totals-breakdown {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.78rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
}

.total-row.discount-row {
  color: #b45309;
}

.total-highlight-box {
  background: #0f172a;
  color: #ffffff;
  border-radius: var(--radius-xs);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.highlight-label {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #94a3b8;
  display: block;
}

.highlight-sub {
  font-size: 0.68rem;
  color: #64748b;
}

.highlight-value {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #22c55e;
}

.action-buttons-group {
  display: flex;
  gap: 8px;
}

.btn-action-cancel {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  border-radius: var(--radius-xs);
  padding: 10px 14px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action-cancel:hover:not(:disabled) {
  background-color: #fecaca;
}

.btn-action-pay {
  flex: 1;
  background: #15803d;
  border: 1px solid #166534;
  border-radius: var(--radius-xs);
  color: #ffffff;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-action-pay:hover:not(:disabled) {
  background: #166534;
}

.btn-action-pay:disabled,
.btn-action-cancel:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pay-btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-kbd {
  background-color: #0f172a;
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 0.7rem;
  font-weight: 700;
}

.btn-kbd.pay {
  background-color: #052e16;
  color: #86efac;
}

.pay-text {
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.pay-amount {
  font-size: 1.05rem;
  font-weight: 800;
}

@media (max-width: 640px) {
  .customer-strip {
    flex-wrap: wrap;
    gap: 6px;
  }
  .customer-input-group {
    width: 100%;
  }
  .btn-discount-trigger {
    width: 100%;
    text-align: center;
    padding: 6px 10px;
  }
  .total-highlight-box {
    padding: 10px 12px;
  }
  .highlight-value {
    font-size: 1.5rem;
  }
  .action-buttons-group {
    flex-direction: column;
  }
  .btn-action-pay {
    min-height: 48px;
    padding: 12px 16px;
    touch-action: manipulation;
  }
  .btn-action-cancel {
    justify-content: center;
    padding: 8px 12px;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .pos-totals-card {
    padding: 6px 10px;
    gap: 4px;
  }
  .customer-strip {
    padding-bottom: 2px;
    margin-bottom: 2px;
  }
  .phone-input {
    font-size: 0.72rem;
  }
  .totals-breakdown {
    padding: 2px 0;
    font-size: 0.72rem;
  }
  .total-highlight-box {
    padding: 4px 8px;
  }
  .highlight-value {
    font-size: 1.2rem;
  }
  .highlight-label {
    font-size: 0.7rem;
  }
  .btn-action-pay {
    padding: 6px 12px;
  }
  .pay-text {
    font-size: 0.78rem;
  }
  .pay-amount {
    font-size: 0.88rem;
  }
  .btn-action-cancel {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}
</style>
