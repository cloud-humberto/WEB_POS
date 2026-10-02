<template>
  <header class="pos-header">
    <div class="pos-brand">
      <div class="terminal-badge">
        <span class="status-indicator"></span>
        <span class="station-label mono">TERM {{ posStation }} &bull; ONLINE</span>
      </div>
      <div class="operator-info">
        <span class="op-label">USER:</span>
        <span class="op-name">{{ userName }}</span>
        <span class="role-pill mono" :class="userRole">
          [{{ userRole.toUpperCase() }}]
        </span>
      </div>
    </div>

    <!-- Center: POS Function Key Shortcuts -->
    <div class="pos-shortcuts">
      <button class="key-btn" @click="$emit('open-search')" title="Product Lookup [F2]">
        <span class="kbd mono">F2</span>
        <span class="key-label">SEARCH</span>
      </button>

      <!-- Admin only inventory button -->
      <button 
        v-if="canManageProducts"
        class="key-btn admin-btn" 
        @click="$emit('open-inventory')" 
        title="Inventory & Users [F3]"
      >
        <span class="kbd mono">F3</span>
        <span class="key-label">INVENTORY</span>
      </button>

      <button 
        class="key-btn pay-btn" 
        :disabled="isCartEmpty"
        @click="$emit('open-checkout')" 
        title="Tender / Pay [F4]"
      >
        <span class="kbd mono">F4</span>
        <span class="key-label">PAY</span>
      </button>

      <button 
        class="key-btn void-btn" 
        :disabled="isCartEmpty"
        @click="$emit('cancel-sale')" 
        title="Void Current Sale [F8]"
      >
        <span class="kbd mono">F8</span>
        <span class="key-label">VOID</span>
      </button>

      <button class="key-btn" @click="$emit('open-history')" title="Daily Reports [F9]">
        <span class="kbd mono">F9</span>
        <span class="key-label">REPORTS</span>
      </button>

      <!-- Switch User / Logout button -->
      <button class="key-btn lock-btn" @click="$emit('lock-terminal')" title="Lock Terminal / Switch User">
        <span class="key-label">LOCK</span>
      </button>
    </div>

    <!-- Right: Digital Clock -->
    <div class="pos-clock mono">
      <div class="clock-time">{{ currentTime }}</div>
      <div class="clock-date">{{ currentDate }}</div>
    </div>
  </header>
</template>

<script>
import { mapGetters } from 'vuex';
import { formatTime } from '@/utils/formatters';

export default {
  name: 'PosHeader',
  data() {
    return {
      currentTime: formatTime(),
      currentDate: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
      timerId: null
    };
  },
  computed: {
    ...mapGetters('pos', ['posStation', 'isCartEmpty']),
    ...mapGetters('auth', ['userName', 'userRole', 'canManageProducts'])
  },
  mounted() {
    this.timerId = setInterval(() => {
      this.currentTime = formatTime();
    }, 1000);
  },
  beforeDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
};
</script>

<style scoped>
.pos-header {
  height: 52px;
  background-color: #0f172a;
  border-bottom: 2px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
  flex-shrink: 0;
  color: #f1f5f9;
}

.pos-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.terminal-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e293b;
  border: 1px solid #334155;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
}

.status-indicator {
  width: 8px;
  height: 8px;
  background-color: #22c55e;
  border-radius: 50%;
}

.station-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.05em;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.op-label {
  font-weight: 700;
  color: #64748b;
}

.op-name {
  color: #e2e8f0;
  font-weight: 700;
}

.role-pill {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 2px;
}
.role-pill.admin {
  background: #fef3c7;
  color: #92400e;
}
.role-pill.cashier {
  background: #e0f2fe;
  color: #0369a1;
}

.pos-shortcuts {
  display: flex;
  align-items: center;
  gap: 6px;
}

.key-btn {
  background: #1e293b;
  border: 1px solid #475569;
  color: #f1f5f9;
  padding: 4px 10px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.1s ease;
}

.key-btn:hover:not(:disabled) {
  background: #334155;
  border-color: #64748b;
}

.key-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.key-btn .kbd {
  background: #0f172a;
  color: #38bdf8;
  border: 1px solid #334155;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 0.68rem;
}

.key-btn.admin-btn {
  background: #78350f;
  border-color: #92400e;
  color: #fef3c7;
}
.key-btn.admin-btn:hover {
  background: #92400e;
}
.key-btn.admin-btn .kbd {
  background: #451a03;
  color: #fde68a;
  border-color: #78350f;
}

.key-btn.pay-btn {
  background: #15803d;
  border-color: #166534;
  color: #ffffff;
}
.key-btn.pay-btn:hover:not(:disabled) {
  background: #166534;
}
.key-btn.pay-btn .kbd {
  background: #052e16;
  color: #86efac;
  border-color: #166534;
}

.key-btn.void-btn {
  background: #7f1d1d;
  border-color: #991b1b;
  color: #fecaca;
}
.key-btn.void-btn:hover:not(:disabled) {
  background: #991b1b;
}
.key-btn.void-btn .kbd {
  background: #450a0a;
  color: #fca5a5;
  border-color: #7f1d1d;
}

.key-btn.lock-btn {
  background: #334155;
  border-color: #64748b;
  color: #cbd5e1;
}

.pos-clock {
  text-align: right;
  line-height: 1.15;
}

.clock-time {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
}

.clock-date {
  font-size: 0.68rem;
  color: #94a3b8;
}
</style>
