<template>
  <div class="modal-overlay" @keydown.esc="$emit('close')">
    <div class="modal-container history-modal">
      <div class="modal-header">
        <div class="modal-title mono">
          <h3>DAILY REGISTER REPORT &amp; TRANSACTION LOG</h3>
          <span class="modal-subtitle">TOTALS, AUDIT TRAIL, AND RECEIPT REPRINTS</span>
        </div>

        <button type="button" class="btn-modal-close mono" @click="$emit('close')">[ESC]</button>
      </div>

      <!-- Metrics Summary -->
      <div class="metrics-grid mono">
        <div class="metric-card">
          <span class="metric-title">GROSS SALES TODAY</span>
          <span class="metric-val">{{ formatMoney(totalRevenueToday) }}</span>
          <span class="metric-desc">{{ totalOrdersToday }} transactions recorded</span>
        </div>

        <div class="metric-card">
          <span class="metric-title">AVERAGE TICKET</span>
          <span class="metric-val">{{ formatMoney(averageTicketToday) }}</span>
          <span class="metric-desc">Per transaction</span>
        </div>

        <div class="metric-card">
          <span class="metric-title">TENDER BREAKDOWN</span>
          <div class="payment-split-lines">
            <div class="split-line">
              <span>CASH:</span>
              <strong>{{ formatMoney(salesByPaymentMethod.cash) }}</strong>
            </div>
            <div class="split-line">
              <span>CREDIT:</span>
              <strong>{{ formatMoney(salesByPaymentMethod.credit) }}</strong>
            </div>
            <div class="split-line">
              <span>DEBIT:</span>
              <strong>{{ formatMoney(salesByPaymentMethod.debit) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="history-table-wrap">
        <table class="history-table mono">
          <thead>
            <tr>
              <th>TICKET #</th>
              <th>TIMESTAMP</th>
              <th>ITEMS</th>
              <th>TENDER</th>
              <th class="text-right">TOTAL</th>
              <th class="text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="allSales.length === 0">
              <td colspan="6" class="no-sales">
                No closed transactions recorded on this register today.
              </td>
            </tr>
            <tr v-for="sale in allSales" :key="sale.id" class="sale-row">
              <td class="font-bold">#{{ String(sale.saleNumber).padStart(6, '0') }}</td>
              <td class="time-cell">{{ formatTimeStr(sale.timestamp) }}</td>
              <td>{{ sale.items.length }} {{ sale.items.length === 1 ? 'item' : 'items' }}</td>
              <td>
                <span class="pay-tag">
                  {{ sale.payment.method.toUpperCase() }}
                </span>
              </td>
              <td class="text-right font-bold">{{ formatMoney(sale.totalAmount) }}</td>
              <td class="text-center">
                <button 
                  type="button" 
                  class="btn-reprint mono" 
                  @click="$emit('view-receipt', sale)"
                  title="Reprint receipt"
                >
                  VIEW RECEIPT
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer mono">
        <button 
          v-if="allSales.length > 0"
          type="button" 
          class="btn-clear-history" 
          @click="handleClearHistory"
        >
          [CLEAR REGISTER LOG]
        </button>
        <span v-else></span>

        <button type="button" class="btn-cancel" @click="$emit('close')">
          [ESC] CLOSE
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { formatCurrency, formatDateTime } from '@/utils/formatters';

export default {
  name: 'ModalHistory',
  computed: {
    ...mapGetters('sales', [
      'allSales', 
      'totalRevenueToday', 
      'totalOrdersToday', 
      'averageTicketToday', 
      'salesByPaymentMethod'
    ])
  },
  methods: {
    ...mapActions('sales', ['clearSalesHistory']),

    formatMoney(val) {
      return formatCurrency(val);
    },

    formatTimeStr(iso) {
      return formatDateTime(iso);
    },

    handleClearHistory() {
      if (confirm('Are you sure you want to reset the register transaction log?')) {
        this.clearSalesHistory();
      }
    }
  }
};
</script>

<style scoped>
.history-modal {
  width: 800px;
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
  font-size: 0.92rem;
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 14px;
  background-color: #f8fafc;
  border-bottom: 1px solid var(--border-main);
}

.metric-card {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.metric-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.05em;
}

.metric-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 2px 0;
}

.metric-desc {
  font-size: 0.68rem;
  color: #64748b;
}

.payment-split-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.7rem;
  margin-top: 4px;
}

.split-line {
  display: flex;
  justify-content: space-between;
  color: #475569;
}

.history-table-wrap {
  max-height: 320px;
  overflow-y: auto;
  background: #ffffff;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.history-table th {
  background-color: #f1f5f9;
  padding: 8px 12px;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #cbd5e1;
}

.history-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
}

.font-bold { font-weight: 700; }
.time-cell { font-size: 0.72rem; color: #64748b; }

.pay-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 6px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
}

.btn-reprint {
  background: #0f172a;
  border: none;
  color: #ffffff;
  padding: 3px 8px;
  border-radius: 2px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-reprint:hover {
  background: #334155;
}

.text-right { text-align: right; }
.text-center { text-align: center; }

.no-sales {
  text-align: center;
  padding: 35px;
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

.btn-clear-history {
  background: transparent;
  border: none;
  color: #b91c1c;
  font-size: 0.72rem;
  cursor: pointer;
  font-weight: 700;
}

.btn-clear-history:hover {
  text-decoration: underline;
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

@media (max-width: 640px) {
  .history-modal {
    width: 98vw;
    max-height: 92vh;
  }
  .report-summary-bar {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .modal-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .history-table th:nth-child(4), .history-table td:nth-child(4) {
    display: none;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .history-modal {
    max-height: 96vh;
    max-height: 96dvh;
    width: 95vw;
  }
  .modal-header {
    padding: 4px 10px;
  }
  .modal-subtitle {
    display: none;
  }
  .report-summary-bar {
    padding: 4px 8px;
    gap: 8px;
  }
  .modal-table-wrap {
    max-height: calc(96vh - 90px);
    overflow-y: auto;
  }
  .history-table th, .history-table td {
    padding: 4px 6px;
    font-size: 0.7rem;
  }
  .modal-footer {
    padding: 4px 10px;
  }
}
</style>
