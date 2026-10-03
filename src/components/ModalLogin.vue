<template>
  <div class="modal-overlay">
    <div class="modal-container login-modal">
      <div class="login-header">
        <div class="login-title mono">
          <h3>OPERATOR TERMINAL SIGN-IN</h3>
          <span class="login-subtitle">SELECT OPERATOR ROLE &amp; ENTER 4-DIGIT PIN</span>
        </div>
      </div>

      <div class="login-body mono">
        <!-- 1. Operator Selection Buttons (No barcodes) -->
        <div class="operator-section">
          <label class="field-label">SELECT OPERATOR ROLE:</label>
          <div class="operator-grid">
            <button
              v-for="u in employees"
              :key="u.id"
              type="button"
              class="operator-btn"
              :class="{ active: selectedUsername === u.username }"
              @click="selectOperator(u)"
            >
              <div class="op-btn-top">
                <span class="op-role-tag" :class="u.role">{{ u.role.toUpperCase() }}</span>
                <span class="op-key-tag">[{{ u.key }}]</span>
              </div>
              <div class="op-btn-name">{{ u.name }}</div>
              <div class="op-btn-desc">
                {{ u.role === 'admin' ? 'FULL ADMIN • 50% DISC • CRUD' : 'CASHIER CLERK • 10% DISC' }}
              </div>
            </button>
          </div>
        </div>

        <!-- 2. Authentication Form -->
        <form @submit.prevent="handleAuthenticate" class="login-form">
          <div class="form-row">
            <label class="field-label">OPERATOR USERNAME:</label>
            <input
              ref="usernameInput"
              v-model="username"
              type="text"
              placeholder="e.g. admin or clerk"
              required
              autocomplete="off"
              class="input-field"
              @keydown.enter.prevent="focusPin"
            />
          </div>

          <div class="form-row">
            <label class="field-label">4-DIGIT PIN:</label>
            <input
              ref="pinInput"
              v-model="pin"
              type="password"
              maxlength="4"
              placeholder="••••"
              required
              autocomplete="new-password"
              class="input-field pin-field"
            />
          </div>

          <!-- Touch / Click Numeric Keypad -->
          <div class="keypad-grid">
            <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" type="button" class="pad-btn" @click="appendPin(n)">
              {{ n }}
            </button>
            <button type="button" class="pad-btn clr" @click="pin = ''">CLR</button>
            <button type="button" class="pad-btn" @click="appendPin(0)">0</button>
            <button type="button" class="pad-btn del" @click="pin = pin.slice(0, -1)">&larr;</button>
          </div>

          <!-- Error message from SQL validation -->
          <div v-if="errorMessage" class="error-strip">
            ERROR: {{ errorMessage }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-authorize"
            :disabled="!username || pin.length < 4 || isSubmitting"
          >
            {{ isSubmitting ? 'VALIDATING SQL DATABASE...' : 'AUTHORIZE & OPEN TERMINAL [↵ ENTER]' }}
          </button>
        </form>
      </div>

      <!-- Quick Credentials Help Footer -->
      <div class="login-footer mono">
        <div class="footer-title">REGISTERED OPERATORS IN SQL DATABASE:</div>
        <div class="footer-grid">
          <div v-for="emp in employees" :key="emp.id">
            &bull; <strong>{{ emp.name }} ({{ emp.role.toUpperCase() }}):</strong> User: <code>{{ emp.username }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { playBeep, playSuccess, playError } from '@/utils/audio';

export default {
  name: 'ModalLogin',
  data() {
    return {
      username: '',
      pin: '',
      selectedUsername: null,
      errorMessage: '',
      isSubmitting: false
    };
  },
  computed: {
    ...mapGetters('auth', ['allUsers']),
    employees() {
      if (this.allUsers && this.allUsers.length) {
        return this.allUsers.map((u, i) => ({
          id: u.id,
          username: u.username,
          name: u.name || u.username.toUpperCase(),
          role: u.role || 'cashier',
          key: String(i + 1)
        }));
      }
      return [];
    }
  },
  methods: {
    ...mapActions('auth', ['loginWithBackend', 'fetchUsers']),

    selectOperator(op) {
      playBeep();
      this.selectedUsername = op.username;
      this.username = op.username;
      this.pin = ''; // Ensure PIN is never pre-filled
      this.errorMessage = '';
      this.focusPin();
    },

    appendPin(num) {
      if (this.pin.length < 4) {
        this.pin += String(num);
      }
    },

    focusPin() {
      this.$nextTick(() => {
        if (this.$refs.pinInput) {
          this.$refs.pinInput.focus();
          this.$refs.pinInput.select();
        }
      });
    },

    async handleAuthenticate() {
      if (!this.username || this.pin.length < 4) return;
      this.errorMessage = '';
      this.isSubmitting = true;

      try {
        await this.loginWithBackend({
          identifier: this.username,
          pin: this.pin
        });
        playSuccess();
        this.$emit('authenticated');
      } catch (err) {
        playError();
        this.errorMessage = err.message || 'Login validation failed.';
      } finally {
        this.isSubmitting = false;
      }
    },

    handleKeydown(e) {
      // Quick key shortcut to select operator if input isn't active
      if (!this.pin && (e.key === '1' || e.key === '2')) {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag !== 'INPUT') {
          const found = this.employees.find(emp => emp.key === e.key);
          if (found) {
            e.preventDefault();
            this.selectOperator(found);
          }
        }
      }
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
    this.fetchUsers();
    this.$nextTick(() => {
      if (this.$refs.usernameInput) {
        this.$refs.usernameInput.focus();
      }
    });
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeydown);
  }
};
</script>

<style scoped>
.login-modal {
  width: 460px;
  background-color: #ffffff;
  border: 2px solid #0f172a;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.login-header {
  padding: 12px 18px;
  background-color: #0f172a;
  color: #ffffff;
  border-bottom: 2px solid #334155;
}

.login-title h3 {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.login-subtitle {
  font-size: 0.65rem;
  color: #94a3b8;
}

.login-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f8fafc;
}

.field-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 4px;
  display: block;
}

/* Operator Selection Cards */
.operator-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.operator-btn {
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: var(--radius-xs);
  padding: 10px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.15s ease;
  font-family: inherit;
}

.operator-btn:hover {
  border-color: #0284c7;
  background-color: #f8fafc;
}

.operator-btn.active {
  background-color: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.op-btn-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.op-role-tag {
  font-size: 0.6rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 2px;
}
.op-role-tag.admin { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.op-role-tag.cashier { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

.operator-btn.active .op-role-tag.admin { background: #b45309; color: #ffffff; border-color: #d97706; }
.operator-btn.active .op-role-tag.cashier { background: #0369a1; color: #ffffff; border-color: #38bdf8; }

.op-key-tag {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 700;
}
.operator-btn.active .op-key-tag {
  color: #38bdf8;
}

.op-btn-name {
  font-size: 0.78rem;
  font-weight: 800;
}

.op-btn-desc {
  font-size: 0.6rem;
  color: #64748b;
  line-height: 1.2;
}
.operator-btn.active .op-btn-desc {
  color: #94a3b8;
}

/* Form Styles */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.input-field {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 8px 10px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  border-radius: var(--radius-xs);
}

.input-field:focus {
  border-color: #0284c7;
}

.pin-field {
  letter-spacing: 6px;
  font-size: 1.1rem;
  font-weight: 800;
}

/* Numeric Keypad */
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin: 4px 0;
}

.pad-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
  padding: 8px 0;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--radius-xs);
  font-family: inherit;
}

.pad-btn:hover {
  background: #e2e8f0;
}

.pad-btn.clr {
  color: #dc2626;
  font-size: 0.75rem;
}

.pad-btn.del {
  color: #d97706;
}

.error-strip {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 6px 10px;
  font-size: 0.72rem;
  font-weight: 700;
}

.btn-authorize {
  background: #15803d;
  color: #ffffff;
  border: none;
  padding: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  border-radius: var(--radius-xs);
  letter-spacing: 0.05em;
  font-family: inherit;
  margin-top: 4px;
}

.btn-authorize:hover:not(:disabled) {
  background: #166534;
}

.btn-authorize:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.login-footer {
  padding: 10px 16px;
  background-color: #f1f5f9;
  border-top: 1px solid #cbd5e1;
  font-size: 0.65rem;
  color: #475569;
}

.footer-title {
  font-weight: 800;
  margin-bottom: 4px;
}

.footer-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.footer-grid code {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 1px 4px;
  border-radius: 2px;
}

@media (max-width: 640px) {
  .login-modal {
    width: 96vw;
    max-height: 92vh;
    overflow-y: auto;
  }
  .login-body {
    padding: 12px;
  }
  .operator-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .pad-btn {
    padding: 12px 0;
    font-size: 1.1rem;
    touch-action: manipulation;
  }
  .btn-authorize {
    padding: 14px;
    font-size: 0.85rem;
    min-height: 48px;
    touch-action: manipulation;
  }
}

@media (max-height: 520px) and (orientation: landscape) {
  .login-modal {
    max-height: 96vh;
    max-height: 96dvh;
    overflow-y: auto;
    width: 95vw;
    max-width: 680px;
  }
  .login-header {
    padding: 4px 10px;
  }
  .login-subtitle {
    display: none;
  }
  .login-body {
    padding: 6px 10px;
    display: grid;
    grid-template-columns: 45% 55%;
    gap: 8px;
  }
  .operator-section {
    margin-bottom: 0;
  }
  .operator-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .operator-btn {
    padding: 4px 6px;
  }
  .op-btn-name {
    font-size: 0.78rem;
  }
  .op-btn-desc {
    display: none;
  }
  .form-row {
    gap: 1px;
  }
  .input-field {
    padding: 4px 8px;
    font-size: 0.82rem;
  }
  .keypad-grid {
    margin: 2px 0;
    gap: 2px;
  }
  .pad-btn {
    padding: 4px 0;
    font-size: 0.82rem;
  }
  .btn-authorize {
    padding: 6px;
    font-size: 0.75rem;
  }
  .login-footer {
    padding: 4px 10px;
    font-size: 0.6rem;
  }
}
</style>
