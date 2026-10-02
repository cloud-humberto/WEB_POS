<template>
  <div class="modal-overlay" @keydown.esc="$emit('close')">
    <div class="modal-container checkout-modal">
      <div class="modal-header">
        <div class="modal-title mono">
          <h3>TENDER TRANSACTION</h3>
          <span class="modal-subtitle">SELECT PAYMENT METHOD OR ENTER CASH TENDERED</span>
        </div>

        <button type="button" class="btn-modal-close mono" @click="$emit('close')">[ESC]</button>
      </div>

      <div class="modal-body">
        <!-- Payment Methods List -->
        <div class="payment-methods-grid">
          <button
            v-for="method in methods"
            :key="method.id"
            type="button"
            class="method-btn mono"
            :class="{ active: selectedMethod === method.id }"
            @click="selectMethod(method.id)"
          >
            <div class="method-btn-top">
              <span class="method-label">{{ method.name }}</span>
              <kbd class="method-kbd">[{{ method.key }}]</kbd>
            </div>
          </button>
        </div>

        <!-- Tender Details -->
        <div class="payment-details-panel">
          <div class="total-to-pay-box mono">
            <span class="to-pay-label">TOTAL DUE:</span>
            <span class="to-pay-value">{{ formatMoney(totalAmount) }}</span>
          </div>

          <!-- CASH TENDER -->
          <div v-if="selectedMethod === 'cash'" class="method-panel cash-panel">
            <label class="panel-label mono">AMOUNT TENDERED ($):</label>
            <div class="cash-input-wrap">
              <span class="currency-prefix mono">$</span>
              <input
                ref="cashInput"
                v-model.number="receivedAmount"
                type="number"
                step="0.01"
                min="0"
                class="cash-input mono"
                placeholder="0.00"
                @keydown.enter="handleFinalize"
              />
            </div>

            <!-- Quick Bills -->
            <div class="quick-cash-chips">
              <button 
                type="button" 
                class="chip-btn mono" 
                @click="receivedAmount = totalAmount"
              >EXACT</button>
              <button 
                v-for="bill in [5, 10, 20, 50, 100]" 
                :key="bill" 
                type="button" 
                class="chip-btn mono"
                @click="addCash(bill)"
              >+${{ bill }}</button>
            </div>

            <!-- Change Due -->
            <div 
              class="change-box mono" 
              :class="changeAmount >= 0 ? 'change-positive' : 'change-negative'"
            >
              <span class="change-label">
                {{ changeAmount >= 0 ? 'CHANGE DUE:' : 'REMAINING DUE:' }}
              </span>
              <span class="change-val">
                {{ formatMoney(Math.abs(changeAmount)) }}
              </span>
            </div>
          </div>

          <!-- CARD / OTHER TENDER -->
          <div v-else class="method-panel card-panel mono">
            <div class="terminal-msg">
              <div class="msg-title">CARD TERMINAL READY</div>
              <p>Swipe, insert chip, or tap customer card on pin pad.</p>
              <div class="terminal-sub">METHOD: {{ selectedMethod.toUpperCase() }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel mono" @click="$emit('close')">
          [ESC] CANCEL
        </button>

        <button
          type="button"
          class="btn-confirm-pay mono"
          :disabled="!isPaymentValid"
          @click="handleFinalize"
        >
          <span>COMPLETE SALE [↵ ENTER]</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { formatCurrency } from '@/utils/formatters';
import { playSuccess, playError } from '@/utils/audio';
import { openReceiptPdfInNewTab } from '@/utils/pdfReceipt';

export default {
  name: 'ModalCheckout',
  data() {
    return {
      selectedMethod: 'cash',
      receivedAmount: null,
      methods: [
        { id: 'cash', name: '1. CASH', key: '1' },
        { id: 'credit', name: '2. CREDIT CARD', key: '2' },
        { id: 'debit', name: '3. DEBIT CARD', key: '3' },
        { id: 'gift_card', name: '4. GIFT CARD', key: '4' }
      ]
    };
  },
  computed: {
    ...mapGetters('pos', ['totalAmount']),

    changeAmount() {
      const rec = Number(this.receivedAmount) || 0;
      return rec - this.totalAmount;
    },

    isPaymentValid() {
      if (this.selectedMethod === 'cash') {
        return (Number(this.receivedAmount) || 0) >= this.totalAmount;
      }
      return true;
    }
  },
  watch: {
    selectedMethod(newVal) {
      if (newVal === 'cash') {
        this.$nextTick(() => {
          if (this.$refs.cashInput) {
            this.$refs.cashInput.focus();
            this.$refs.cashInput.select();
          }
        });
      }
    }
  },
  methods: {
    ...mapActions('pos', ['finishSale']),

    formatMoney(val) {
      return formatCurrency(val);
    },

    selectMethod(methodId) {
      this.selectedMethod = methodId;
    },

    addCash(val) {
      const current = Number(this.receivedAmount) || 0;
      this.receivedAmount = Number((current + val).toFixed(2));
    },

    async handleFinalize() {
      if (!this.isPaymentValid) {
        playError();
        return;
      }

      // Pre-open a blank tab in the synchronous click context to guarantee browser doesn't block popup
      let pdfTab = null;
      try {
        pdfTab = window.open('', '_blank');
        if (pdfTab && pdfTab.document) {
          pdfTab.document.open();
          pdfTab.document.write('<!DOCTYPE html><html><head><title>Receipt PDF</title></head><body style="font-family:monospace;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div>GENERATING 80MM CUSTOMER RECEIPT PDF...</div></body></html>');
          pdfTab.document.close();
        }
      } catch (e) {
        console.warn('Could not pre-open window:', e);
      }

      const paymentInfo = {
        method: this.selectedMethod,
        receivedAmount: this.selectedMethod === 'cash' ? Number(this.receivedAmount) : this.totalAmount,
        change: this.selectedMethod === 'cash' ? Math.max(0, this.changeAmount) : 0
      };

      const completedSale = await this.finishSale(paymentInfo);
      playSuccess();

      // Render and route PDF to the prepared new tab
      try {
        openReceiptPdfInNewTab(completedSale, pdfTab);
      } catch (err) {
        console.error('PDF error:', err);
      }

      // Emits sale-completed so the receipt is shown right on screen
      this.$emit('sale-completed', completedSale);
    },

    handleKeydown(e) {
      if (e.key === '1') this.selectMethod('cash');
      else if (e.key === '2') this.selectMethod('credit');
      else if (e.key === '3') this.selectMethod('debit');
      else if (e.key === '4') this.selectMethod('gift_card');
    }
  },
  mounted() {
    this.receivedAmount = this.totalAmount;
    window.addEventListener('keydown', this.handleKeydown);
    this.$nextTick(() => {
      if (this.$refs.cashInput) {
        this.$refs.cashInput.focus();
        this.$refs.cashInput.select();
      }
    });
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
  }
};
</script>

<style scoped>
.checkout-modal {
  width: 620px;
}

.modal-header {
  padding: 12px 18px;
  background-color: #0f172a;
  color: #ffffff;
  border-bottom: 1px solid var(--border-dark);
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
  font-size: 0.68rem;
  color: #94a3b8;
}

.btn-modal-close {
  background: none;
  border: 1px solid #334155;
  color: #94a3b8;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 2px 6px;
}

.modal-body {
  padding: 16px;
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  background: #f8fafc;
}

.payment-methods-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.method-btn {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-xs);
  padding: 10px;
  cursor: pointer;
  text-align: left;
}

.method-btn:hover {
  background-color: #f1f5f9;
}

.method-btn.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.method-btn-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.method-label {
  font-size: 0.8rem;
  font-weight: 700;
}

.method-kbd {
  font-size: 0.68rem;
  color: #64748b;
}

.method-btn.active .method-kbd {
  color: #38bdf8;
}

.payment-details-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.total-to-pay-box {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.to-pay-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.to-pay-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.panel-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
  display: block;
}

.cash-input-wrap {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 2px solid #0f172a;
  padding: 6px 10px;
  margin-bottom: 8px;
}

.currency-prefix {
  font-size: 1.1rem;
  font-weight: 700;
  color: #64748b;
  margin-right: 6px;
}

.cash-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
}

.quick-cash-chips {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.chip-btn {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.chip-btn:hover {
  background-color: #e2e8f0;
}

.change-box {
  border-radius: var(--radius-xs);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #cbd5e1;
}

.change-positive {
  background-color: #dcfce7;
  border-color: #86efac;
  color: #15803d;
}

.change-negative {
  background-color: #fee2e2;
  border-color: #fca5a5;
  color: #b91c1c;
}

.change-label {
  font-size: 0.75rem;
  font-weight: 700;
}

.change-val {
  font-size: 1.25rem;
  font-weight: 800;
}

.card-panel {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  padding: 24px 16px;
  text-align: center;
}

.msg-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
}

.card-panel p {
  font-size: 0.78rem;
  color: #64748b;
  margin-bottom: 10px;
}

.terminal-sub {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0284c7;
}

.modal-footer {
  padding: 10px 16px;
  background-color: #ffffff;
  border-top: 1px solid var(--border-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 6px 12px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-confirm-pay {
  background: #15803d;
  border: none;
  color: #ffffff;
  padding: 8px 18px;
  border-radius: var(--radius-xs);
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
}

.btn-confirm-pay:hover:not(:disabled) {
  background: #166534;
}

.btn-confirm-pay:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
