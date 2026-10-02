<template>
  <div class="modal-overlay" @keydown.esc="$emit('close')">
    <div class="modal-container receipt-modal">
      <!-- Top Action Bar -->
      <div class="receipt-actions-bar no-print mono">
        <span class="status-text">TRANSACTION COMPLETED</span>
        <div class="actions-right">
          <button type="button" class="btn-pdf-tab mono" @click="handleOpenPdfTab">
            [PDF] OPEN IN TAB
          </button>
          <button type="button" class="btn-print mono" @click="handlePrint">
            PRINT RECEIPT [P]
          </button>
          <button type="button" class="btn-new-sale mono" @click="$emit('close')">
            NEW TRANSACTION [ESC]
          </button>
        </div>
      </div>

      <!-- Thermal Paper Receipt -->
      <div class="thermal-paper mono">
        <div class="receipt-head">
          <div class="store-name">NOVAPOS RETAIL STORE</div>
          <div class="store-sub">STORE #0101 &bull; REGISTER 01</div>
          <div class="store-address">100 MAIN STREET, SAN FRANCISCO, CA</div>
          <div class="store-tel">TEL: (415) 555-0199</div>
          <div class="line-divider">========================================</div>
          <div class="receipt-type">CUSTOMER RECEIPT</div>
          <div class="receipt-num">RECEIPT #: {{ String(sale.saleNumber).padStart(6, '0') }}</div>
          <div class="line-divider">========================================</div>
        </div>

        <div class="receipt-meta">
          <div class="meta-row">
            <span>DATE: {{ formatDate(sale.timestamp) }}</span>
          </div>
          <div class="meta-row">
            <span>REG: {{ sale.posStation }}</span>
            <span>CASHIER: {{ sale.operator }}</span>
          </div>
          <div v-if="sale.customer && sale.customer.phone" class="meta-row">
            <span>CUST ID: {{ sale.customer.phone }}</span>
          </div>
          <div class="line-divider">----------------------------------------</div>
        </div>

        <!-- Line Items -->
        <div class="receipt-items">
          <div class="items-header">
            <span>QTY  DESCRIPTION</span>
            <span>TOTAL</span>
          </div>
          <div class="line-divider">----------------------------------------</div>

          <div 
            v-for="(item, i) in sale.items" 
            :key="item.id" 
            class="receipt-item-row"
          >
            <div class="item-desc-line">
              <span>{{ item.qty }}x  {{ item.name }}</span>
              <span class="item-amount">{{ formatMoney(item.total) }}</span>
            </div>
            <div class="item-calc-line">
              <span>SKU: {{ item.barcode.slice(-6) }} @ {{ formatMoney(item.price) }} /{{ item.unit }}</span>
              <span v-if="item.discount > 0" class="item-disc">(-{{ formatMoney(item.discount) }})</span>
            </div>
          </div>
          <div class="line-divider">----------------------------------------</div>
        </div>

        <!-- Totals & Taxes -->
        <div class="receipt-totals">
          <div class="tot-row">
            <span>ITEMS SOLD:</span>
            <span>{{ totalItemQty }}</span>
          </div>
          <div class="tot-row">
            <span>SUBTOTAL:</span>
            <span>{{ formatMoney(sale.subtotal) }}</span>
          </div>
          <div v-if="sale.discountTotal > 0" class="tot-row">
            <span>DISCOUNT:</span>
            <span>-{{ formatMoney(sale.discountTotal) }}</span>
          </div>
          <div class="tot-row">
            <span>SALES TAX (8.0%):</span>
            <span>{{ formatMoney(sale.taxAmount || 0) }}</span>
          </div>
          <div class="line-divider">========================================</div>
          <div class="tot-row total-highlight">
            <span>TOTAL DUE:</span>
            <span>{{ formatMoney(sale.totalAmount) }}</span>
          </div>
          <div class="line-divider">========================================</div>
        </div>

        <!-- Tender & Change -->
        <div class="receipt-payment">
          <div class="tot-row">
            <span>PAYMENT METHOD:</span>
            <span>{{ String(sale.payment.method).toUpperCase() }}</span>
          </div>
          <div v-if="sale.payment.method === 'cash'" class="tot-row">
            <span>CASH TENDERED:</span>
            <span>{{ formatMoney(sale.payment.receivedAmount) }}</span>
          </div>
          <div v-if="sale.payment.method === 'cash'" class="tot-row change-highlight">
            <span>CHANGE DUE:</span>
            <span>{{ formatMoney(sale.payment.change || 0) }}</span>
          </div>
          <div class="line-divider">----------------------------------------</div>
        </div>

        <!-- Footer -->
        <div class="receipt-footer">
          <div class="thank-you">THANK YOU FOR YOUR BUSINESS!</div>
          <div class="return-policy">RETURN WITHIN 30 DAYS WITH RECEIPT</div>
          
          <div class="barcode-sim">
            *{{ sale.id }}*
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { openReceiptPdfInNewTab } from '@/utils/pdfReceipt';

export default {
  name: 'ReceiptThermal',
  props: {
    sale: {
      type: Object,
      required: true
    }
  },
  computed: {
    totalItemQty() {
      if (!this.sale || !this.sale.items) return 0;
      return this.sale.items.reduce((acc, it) => acc + it.qty, 0);
    }
  },
  methods: {
    formatMoney(val) {
      return formatCurrency(val);
    },
    formatDate(iso) {
      return formatDateTime(iso);
    },
    handlePrint() {
      window.print();
    },
    handleOpenPdfTab() {
      const tab = window.open('', '_blank');
      openReceiptPdfInNewTab(this.sale, tab);
    },
    handleKeyDown(e) {
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        this.handlePrint();
      } else if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        this.$emit('close');
      }
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
};
</script>

<style scoped>
.receipt-modal {
  width: 440px;
  background-color: #0f172a;
  border: 1px solid #334155;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.receipt-actions-bar {
  padding: 8px 12px;
  background-color: #0f172a;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-text {
  font-size: 0.72rem;
  font-weight: 700;
  color: #22c55e;
}

.actions-right {
  display: flex;
  gap: 6px;
}

.btn-pdf-tab {
  background-color: #0284c7;
  border: 1px solid #0369a1;
  color: #ffffff;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-pdf-tab:hover {
  background-color: #0369a1;
}

.btn-print {
  background-color: #334155;
  border: 1px solid #475569;
  color: #f1f5f9;
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-print:hover {
  background-color: #475569;
}

.btn-new-sale {
  background-color: #15803d;
  border: none;
  color: #ffffff;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-new-sale:hover {
  background-color: #166534;
}

/* Thermal receipt paper */
.thermal-paper {
  background-color: #ffffff;
  color: #0f172a;
  padding: 20px 16px;
  font-size: 0.75rem;
  line-height: 1.3;
  max-height: 75vh;
  overflow-y: auto;
}

.receipt-head {
  text-align: center;
}

.store-name {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.store-sub, .store-address, .store-tel {
  font-size: 0.68rem;
  color: #475569;
}

.receipt-type {
  font-weight: 800;
  font-size: 0.8rem;
}

.receipt-num {
  font-size: 0.75rem;
}

.line-divider {
  overflow: hidden;
  white-space: nowrap;
  letter-spacing: -1px;
  color: #64748b;
  margin: 3px 0;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #334155;
}

.items-header {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  font-size: 0.72rem;
}

.receipt-item-row {
  margin-bottom: 4px;
}

.item-desc-line {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
}

.item-calc-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  color: #64748b;
  padding-left: 12px;
}

.item-disc {
  color: #b45309;
}

.tot-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  font-size: 0.72rem;
}

.tot-row.total-highlight {
  font-size: 1rem;
  font-weight: 900;
  margin: 4px 0;
}

.tot-row.change-highlight {
  font-weight: 800;
  color: #15803d;
}

.receipt-footer {
  text-align: center;
  font-size: 0.68rem;
  color: #475569;
  margin-top: 12px;
}

.thank-you {
  font-weight: 800;
  font-size: 0.78rem;
  color: #0f172a;
}

.return-policy {
  font-size: 0.65rem;
  margin-top: 2px;
}

.barcode-sim {
  font-family: monospace;
  font-size: 0.9rem;
  letter-spacing: 4px;
  margin-top: 10px;
  color: #000000;
}

@media print {
  body * {
    visibility: hidden;
  }
  .thermal-paper, .thermal-paper * {
    visibility: visible;
  }
  .thermal-paper {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
    padding: 0;
  }
  .no-print {
    display: none !important;
  }
}
</style>
