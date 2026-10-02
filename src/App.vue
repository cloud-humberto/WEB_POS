<template>
  <div id="app" class="pos-app-layout">
    <!-- Header -->
    <PosHeader
      @open-search="openSearch"
      @open-inventory="openInventory"
      @open-checkout="openCheckout"
      @cancel-sale="confirmCancelSale"
      @open-history="openHistory"
      @lock-terminal="handleLockTerminal"
    />

    <!-- Main Workspace -->
    <main class="pos-workspace">
      <!-- Left Column: Input and Catalog -->
      <section class="pos-left-column">
        <ProductInput
          ref="productInput"
          @product-added="onProductAdded"
        />

        <ProductCatalog
          @item-picked="onProductAdded"
        />
      </section>

      <!-- Right Column: Tape and Totals -->
      <section class="pos-right-column">
        <CartList ref="cartList">
          <!-- Vue 2 Scoped Slot Customization -->
          <template #item-actions="{ item }">
            <div class="custom-slot-actions mono">
              <button
                type="button"
                class="slot-btn desc"
                title="Line Discount"
                @click="promptItemDiscount(item)"
              >
                DISC
              </button>
              <button
                type="button"
                class="slot-btn del"
                title="Void Line"
                @click="removeItem(item.id)"
              >
                DEL
              </button>
            </div>
          </template>
        </CartList>

        <PosTotals
          @open-checkout="openCheckout"
          @cancel-sale="confirmCancelSale"
        />
      </section>
    </main>

    <!-- Modals -->
    <ModalCheckout
      v-if="isCheckoutOpen"
      @close="closeCheckout"
      @sale-completed="onSaleCompleted"
    />

    <ModalSearch
      v-if="isSearchOpen"
      @close="closeSearch"
    />

    <ModalHistory
      v-if="isHistoryOpen"
      @close="closeHistory"
      @view-receipt="viewHistoricalReceipt"
    />

    <ModalInventory
      v-if="isInventoryOpen"
      @close="closeInventory"
    />

    <!-- Automatic Receipt Presentation after Sale -->
    <ReceiptThermal
      v-if="activeReceipt"
      :sale="activeReceipt"
      @close="closeReceipt"
    />

    <!-- Employee Login Modal (shown if unauthenticated or locked) -->
    <ModalLogin
      v-if="!isAuthenticated"
      @authenticated="onAuthenticated"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import PosHeader from '@/components/PosHeader.vue';
import ProductInput from '@/components/ProductInput.vue';
import ProductCatalog from '@/components/ProductCatalog.vue';
import CartList from '@/components/CartList.vue';
import PosTotals from '@/components/PosTotals.vue';
import ModalCheckout from '@/components/ModalCheckout.vue';
import ModalSearch from '@/components/ModalSearch.vue';
import ModalHistory from '@/components/ModalHistory.vue';
import ModalInventory from '@/components/ModalInventory.vue';
import ModalLogin from '@/components/ModalLogin.vue';
import ReceiptThermal from '@/components/ReceiptThermal.vue';

export default {
  name: 'App',
  components: {
    PosHeader,
    ProductInput,
    ProductCatalog,
    CartList,
    PosTotals,
    ModalCheckout,
    ModalSearch,
    ModalHistory,
    ModalInventory,
    ModalLogin,
    ReceiptThermal
  },
  data() {
    return {
      isCheckoutOpen: false,
      isSearchOpen: false,
      isHistoryOpen: false,
      isInventoryOpen: false,
      activeReceipt: null
    };
  },
  computed: {
    ...mapGetters('pos', ['isCartEmpty']),
    ...mapGetters('auth', ['isAuthenticated', 'canManageProducts'])
  },
  methods: {
    ...mapActions('pos', ['cancelSale', 'removeItem']),
    ...mapActions('auth', ['logout']),

    onAuthenticated() {
      this.refocusScanner();
    },

    handleLockTerminal() {
      this.logout();
    },

    openSearch() {
      this.isSearchOpen = true;
    },
    closeSearch() {
      this.isSearchOpen = false;
      this.refocusScanner();
    },

    openInventory() {
      if (!this.canManageProducts) {
        alert('Permission Denied: Manager role required to access inventory.');
        return;
      }
      this.isInventoryOpen = true;
    },
    closeInventory() {
      this.isInventoryOpen = false;
      this.refocusScanner();
    },

    openCheckout() {
      if (this.isCartEmpty) return;
      this.isCheckoutOpen = true;
    },
    closeCheckout() {
      this.isCheckoutOpen = false;
      this.refocusScanner();
    },

    openHistory() {
      this.isHistoryOpen = true;
    },
    closeHistory() {
      this.isHistoryOpen = false;
      this.refocusScanner();
    },

    viewHistoricalReceipt(sale) {
      this.isHistoryOpen = false;
      this.activeReceipt = sale;
    },

    closeReceipt() {
      this.activeReceipt = null;
      this.refocusScanner();
    },

    onSaleCompleted(sale) {
      this.isCheckoutOpen = false;
      // Receipt has already opened in new tab from ModalCheckout via user gesture
      // Present customer receipt modal on screen
      this.activeReceipt = sale;
    },

    onProductAdded() {
      this.refocusScanner();
    },

    refocusScanner() {
      this.$nextTick(() => {
        if (this.$refs.productInput && typeof this.$refs.productInput.focusInput === 'function') {
          this.$refs.productInput.focusInput();
        }
      });
    },

    confirmCancelSale() {
      if (this.isCartEmpty) return;
      if (confirm('Void current transaction? All items will be restored to inventory.')) {
        this.cancelSale();
        this.refocusScanner();
      }
    },

    promptItemDiscount(item) {
      if (this.$refs.cartList && typeof this.$refs.cartList.promptItemDiscount === 'function') {
        this.$refs.cartList.promptItemDiscount(item);
      }
    },

    handleGlobalKeyDown(e) {
      if (!this.isAuthenticated) return;

      if (e.key === 'F2') {
        e.preventDefault();
        this.openSearch();
      } else if (e.key === 'F3') {
        e.preventDefault();
        this.openInventory();
      } else if (e.key === 'F4') {
        e.preventDefault();
        this.openCheckout();
      } else if (e.key === 'F8') {
        e.preventDefault();
        this.confirmCancelSale();
      } else if (e.key === 'F9') {
        e.preventDefault();
        this.openHistory();
      } else if (e.key === 'Escape') {
        if (this.activeReceipt) this.closeReceipt();
        else if (this.isCheckoutOpen) this.closeCheckout();
        else if (this.isSearchOpen) this.closeSearch();
        else if (this.isInventoryOpen) this.closeInventory();
        else if (this.isHistoryOpen) this.closeHistory();
      }
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleGlobalKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleGlobalKeyDown);
  }
};
</script>

<style>
.pos-app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: var(--bg-app);
  overflow: hidden;
}

.pos-workspace {
  display: grid;
  grid-template-columns: 56% 44%;
  gap: 10px;
  padding: 10px;
  flex: 1;
  min-height: 0;
}

.pos-left-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.pos-right-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.custom-slot-actions {
  display: flex;
  gap: 3px;
}

.slot-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 2px 5px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
}

.slot-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.slot-btn.desc:hover {
  background: #fef3c7;
  color: #92400e;
}

.slot-btn.del {
  color: #b91c1c;
}
.slot-btn.del:hover {
  background: #fee2e2;
}

@media (max-width: 1024px) {
  .pos-workspace {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  body {
    overflow-y: auto;
  }
}
</style>
