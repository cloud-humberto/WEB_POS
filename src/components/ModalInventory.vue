<template>
  <div class="modal-overlay" @keydown.esc="$emit('close')">
    <div class="modal-container inventory-modal">
      <div class="modal-header">
        <div class="modal-title mono">
          <h3>ADMINISTRATION: INVENTORY &amp; EMPLOYEES</h3>
          <span class="modal-subtitle">AUTHORIZED ROLE: MANAGER / ADMIN</span>
        </div>

        <button type="button" class="btn-modal-close mono" @click="$emit('close')">[ESC]</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="inventory-tabs mono">
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: activeTab === 'products' }"
          @click="activeTab = 'products'"
        >
          INVENTORY MANAGEMENT
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: activeTab === 'users' }"
          @click="activeTab = 'users'"
        >
          EMPLOYEE USERS &amp; ROLES
        </button>
      </div>

      <div class="modal-body">
        <!-- 1. PRODUCTS TAB -->
        <div v-if="activeTab === 'products'" class="tab-content">
          <!-- Add New Product Form -->
          <form @submit.prevent="handleAddProduct" class="add-form mono">
            <div class="form-title">ADD NEW PRODUCT</div>
            <div class="form-grid">
              <div class="form-group">
                <label>PRODUCT NAME:</label>
                <input v-model="newProduct.name" type="text" required placeholder="e.g. Sparkling Mineral Water" />
              </div>

              <div class="form-group">
                <label>BARCODE / SKU:</label>
                <input v-model="newProduct.barcode" type="text" required placeholder="e.g. 789123456789" />
              </div>

              <div class="form-group">
                <label>PRICE ($):</label>
                <input v-model.number="newProduct.price" type="number" step="0.01" min="0.01" required placeholder="0.00" />
              </div>

              <div class="form-group">
                <label>CATEGORY:</label>
                <select v-model="newProduct.category">
                  <option value="Beverages">Beverages</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Candy">Candy</option>
                  <option value="Prepared Food">Prepared Food</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div class="form-group">
                <label>STOCK QTY:</label>
                <input v-model.number="newProduct.stock" type="number" min="0" required placeholder="50" />
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-save mono">+ ADD TO INVENTORY</button>
              </div>
            </div>
          </form>

          <!-- Products Table -->
          <div class="table-container">
            <table class="admin-table mono">
              <thead>
                <tr>
                  <th>BARCODE</th>
                  <th>NAME</th>
                  <th>CAT</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th class="text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in allProducts" :key="item.id">
                  <td>{{ item.barcode }}</td>
                  <td class="font-bold">{{ item.name }}</td>
                  <td>{{ item.category }}</td>
                  <td>{{ formatMoney(item.price) }}</td>
                  <td>{{ item.stock }} {{ item.unit }}</td>
                  <td class="text-center">
                    <button 
                      type="button" 
                      class="btn-del mono" 
                      @click="handleDeleteProduct(item)"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. USERS TAB -->
        <div v-else class="tab-content">
          <!-- Add User Form -->
          <form @submit.prevent="handleAddUser" class="add-form mono">
            <div class="form-title">REGISTER NEW EMPLOYEE</div>
            <div class="form-grid">
              <div class="form-group">
                <label>USERNAME:</label>
                <input v-model="newUser.username" type="text" required placeholder="e.g. sarah" />
              </div>

              <div class="form-group">
                <label>FULL NAME:</label>
                <input v-model="newUser.name" type="text" required placeholder="e.g. Sarah Connor" />
              </div>

              <div class="form-group">
                <label>PIN (4 DIGITS):</label>
                <input v-model="newUser.pin" type="text" maxlength="4" required placeholder="e.g. 5555" />
              </div>

              <div class="form-group">
                <label>ROLE &amp; PERMISSION:</label>
                <select v-model="newUser.role">
                  <option value="cashier">CASHIER (Max 10% disc, sales only)</option>
                  <option value="admin">ADMIN (Max 50% disc, full control)</option>
                </select>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-save mono">+ CREATE USER</button>
              </div>
            </div>
          </form>

          <!-- Users Table -->
          <div class="table-container">
            <table class="admin-table mono">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>NAME</th>
                  <th>PIN</th>
                  <th>ROLE</th>
                  <th>MAX DISC.</th>
                  <th class="text-center">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in allUsers" :key="u.id">
                  <td class="font-bold">{{ u.username }}</td>
                  <td>{{ u.name }}</td>
                  <td>****</td>
                  <td>
                    <span class="role-badge" :class="u.role">{{ u.role.toUpperCase() }}</span>
                  </td>
                  <td>{{ u.role === 'admin' ? '50%' : '10%' }}</td>
                  <td class="text-center">
                    <button 
                      type="button" 
                      class="btn-del mono" 
                      @click="handleDeleteUser(u)"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal-footer mono">
        <span>MANAGER SECURITY LOG: ACTIVE</span>
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

export default {
  name: 'ModalInventory',
  data() {
    return {
      activeTab: 'products',
      newProduct: {
        name: '',
        barcode: '',
        price: null,
        category: 'Beverages',
        stock: 50,
        unit: 'EA'
      },
      newUser: {
        username: '',
        name: '',
        pin: '',
        role: 'cashier'
      }
    };
  },
  computed: {
    ...mapGetters('products', ['allProducts']),
    ...mapGetters('auth', ['allUsers', 'canManageProducts', 'currentUser'])
  },
  methods: {
    ...mapActions('products', ['createProduct', 'deleteProduct']),
    ...mapActions('auth', ['createUser', 'deleteUser', 'fetchUsers', 'logout']),

    formatMoney(val) {
      return formatCurrency(val);
    },

    async handleAddProduct() {
      try {
        await this.createProduct(this.newProduct);
        alert(`Product "${this.newProduct.name}" added successfully.`);
        this.newProduct = {
          name: '',
          barcode: '',
          price: null,
          category: 'Beverages',
          stock: 50,
          unit: 'EA'
        };
      } catch (err) {
        alert(err.message);
      }
    },

    async handleDeleteProduct(item) {
      if (confirm(`Are you sure you want to DELETE "${item.name}" from inventory?`)) {
        try {
          await this.deleteProduct(item.id);
        } catch (err) {
          alert(err.message);
        }
      }
    },

    async handleAddUser() {
      try {
        await this.createUser(this.newUser);
        alert(`User "${this.newUser.username}" created successfully.`);
        this.newUser = {
          username: '',
          name: '',
          pin: '',
          role: 'cashier'
        };
      } catch (err) {
        alert(err.message);
      }
    },

    async handleDeleteUser(user) {
      const isOriginalAdmin = user.username === 'admin';
      const promptMsg = isOriginalAdmin
        ? `Are you sure you want to permanently DELETE the original "admin" login? Make sure another administrator user exists if you need management access.`
        : `Delete employee user "${user.username}" (${user.name})?`;

      if (confirm(promptMsg)) {
        try {
          await this.deleteUser(user.id);
          alert(`User "${user.username}" deleted successfully.`);

          // If current logged-in user deleted their own account:
          if (this.currentUser && (this.currentUser.id === user.id || this.currentUser.username === user.username)) {
            alert('Your active login was deleted. Terminal will now lock.');
            this.logout();
            this.$emit('close');
          }
        } catch (err) {
          alert(err.message);
        }
      }
    }
  },
  mounted() {
    this.fetchUsers();
  }
};
</script>

<style scoped>
.inventory-modal {
  width: 840px;
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
  color: #f59e0b;
}

.btn-modal-close {
  background: none;
  border: 1px solid #334155;
  color: #94a3b8;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 2px 6px;
}

.inventory-tabs {
  display: flex;
  background: #f1f5f9;
  border-bottom: 2px solid #cbd5e1;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 8px 16px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  color: #64748b;
  border-right: 1px solid #cbd5e1;
}

.tab-btn.active {
  background: #ffffff;
  color: #0f172a;
  border-bottom: 2px solid #0f172a;
  margin-bottom: -2px;
}

.modal-body {
  padding: 14px;
  background: #f8fafc;
  max-height: 480px;
  overflow-y: auto;
}

.add-form {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 12px;
  margin-bottom: 12px;
}

.form-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-group label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
}

.form-group input, .form-group select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 4px 6px;
  font-size: 0.78rem;
  border-radius: var(--radius-xs);
  outline: none;
}

.form-group input:focus, .form-group select:focus {
  border-color: #0284c7;
}

.form-actions {
  grid-column: span 3;
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.btn-save {
  background: #15803d;
  color: #fff;
  border: none;
  padding: 6px 14px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  border-radius: var(--radius-xs);
}

.btn-save:hover {
  background: #166534;
}

.table-container {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  max-height: 240px;
  overflow-y: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.admin-table th {
  background: #f1f5f9;
  padding: 6px 10px;
  text-align: left;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid #cbd5e1;
}

.admin-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #e2e8f0;
}

.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.text-dim { color: #94a3b8; font-size: 0.68rem; }

.btn-del {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 2px 6px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 2px;
}

.btn-del:hover {
  background: #fecaca;
}

.role-badge {
  padding: 1px 6px;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 700;
}
.role-badge.admin { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
.role-badge.cashier { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

.modal-footer {
  padding: 8px 14px;
  background-color: #f8fafc;
  border-top: 1px solid var(--border-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
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

@media (max-width: 640px) {
  .inventory-modal {
    width: 98vw;
    max-height: 92vh;
  }
  .modal-body {
    padding: 10px;
    max-height: 75vh;
    overflow-y: auto;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .inventory-modal {
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
  .modal-tabs {
    padding: 2px 10px;
  }
  .tab-btn {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
  .modal-body {
    padding: 6px 10px;
    max-height: calc(96vh - 80px);
    overflow-y: auto;
  }
  .form-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-bottom: 6px;
  }
  .input-sm {
    padding: 3px 6px;
    font-size: 0.75rem;
  }
  .btn-save {
    padding: 4px 8px;
    font-size: 0.72rem;
  }
  .table-container {
    max-height: 120px;
  }
  .modal-footer {
    padding: 4px 10px;
  }
}
</style>
