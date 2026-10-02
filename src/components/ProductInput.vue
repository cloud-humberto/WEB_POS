<template>
  <div class="product-input-card">
    <div class="input-header">
      <label for="barcode-input" class="input-label mono">
        SCAN BARCODE / SKU / NAME
      </label>
      <span class="input-tip mono">
        MULTIPLIER: <kbd>QTY*CODE</kbd> (EX: <kbd>3*049000028904</kbd>)
      </span>
    </div>

    <form @submit.prevent="handleSubmit" class="input-form">
      <div class="input-wrapper" :class="{ 'input-error': errorMessage }">
        <span class="prompt-symbol mono">&gt;</span>
        <input
          id="barcode-input"
          ref="barcodeInput"
          v-model="inputQuery"
          type="text"
          class="main-barcode-input mono"
          placeholder="Scan or type product name/code and press ENTER..."
          autocomplete="off"
          @keydown.esc="clearInput"
        />

        <div v-if="multiplier > 1" class="multiplier-tag mono">
          {{ multiplier }}x
        </div>

        <button type="submit" class="btn-enter mono" :disabled="!inputQuery.trim()">
          ENTER [↵]
        </button>
      </div>

      <!-- Error feedback -->
      <div v-if="errorMessage" class="error-feedback mono">
        <span>ERROR: {{ errorMessage }}</span>
        <button type="button" class="btn-close-error" @click="errorMessage = ''">[X]</button>
      </div>
    </form>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { playBeep, playError } from '@/utils/audio';

export default {
  name: 'ProductInput',
  data() {
    return {
      inputQuery: '',
      errorMessage: ''
    };
  },
  computed: {
    ...mapGetters('products', ['allProducts', 'findByBarcode']),
    
    multiplier() {
      if (this.inputQuery.includes('*')) {
        const parts = this.inputQuery.split('*');
        const qty = parseInt(parts[0], 10);
        return (!isNaN(qty) && qty > 0) ? qty : 1;
      }
      return 1;
    }
  },
  methods: {
    ...mapActions('pos', ['addItem']),

    focusInput() {
      this.$nextTick(() => {
        if (this.$refs.barcodeInput) {
          this.$refs.barcodeInput.focus();
        }
      });
    },

    clearInput() {
      this.inputQuery = '';
      this.errorMessage = '';
    },

    handleSubmit() {
      const query = this.inputQuery.trim();
      if (!query) return;

      this.errorMessage = '';
      let qty = 1;
      let targetCode = query;

      if (query.includes('*')) {
        const parts = query.split('*');
        const parsedQty = parseInt(parts[0], 10);
        if (!isNaN(parsedQty) && parsedQty > 0) {
          qty = parsedQty;
          targetCode = parts[1].trim();
        }
      }

      let product = this.findByBarcode(targetCode);

      if (!product) {
        const lower = targetCode.toLowerCase();
        product = this.allProducts.find(p => p.name.toLowerCase().includes(lower));
      }

      if (!product) {
        playError();
        this.errorMessage = `Item "${targetCode}" not found. Press [F2] for catalog.`;
        return;
      }

      try {
        this.addItem({ product, qty });
        playBeep();
        this.inputQuery = '';
        this.$emit('product-added', product);
      } catch (err) {
        playError();
        this.errorMessage = err.message || 'Error adding item';
      } finally {
        this.focusInput();
      }
    }
  },
  mounted() {
    this.focusInput();
  }
};
</script>

<style scoped>
.product-input-card {
  background-color: #ffffff;
  border: 1px solid var(--border-main);
  border-radius: var(--radius-xs);
  padding: 10px 14px;
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.input-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.input-tip {
  font-size: 0.68rem;
  color: var(--text-dim);
}

.input-tip kbd {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 1px 4px;
  border-radius: 2px;
}

.input-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 2px solid #334155;
  border-radius: var(--radius-xs);
  padding: 2px 4px;
}

.input-wrapper:focus-within {
  border-color: #0284c7;
}

.input-wrapper.input-error {
  border-color: #dc2626;
}

.prompt-symbol {
  font-size: 1rem;
  font-weight: 800;
  color: #64748b;
  margin: 0 8px;
}

.main-barcode-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 6px 2px;
}

.main-barcode-input::placeholder {
  color: #94a3b8;
  font-size: 0.85rem;
  font-family: var(--font-main);
}

.multiplier-tag {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 2px;
  margin-right: 6px;
}

.btn-enter {
  background-color: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: 2px;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  letter-spacing: 0.05em;
}

.btn-enter:hover:not(:disabled) {
  background-color: #334155;
}

.btn-enter:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-feedback {
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 6px 10px;
  border-radius: 2px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-close-error {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
