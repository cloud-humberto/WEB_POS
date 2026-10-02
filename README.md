# ⚡ NovaPOS - Industrial Retail POS Terminal (Vue 2 + SQLite)

> Industrial-minimalist Point of Sale (POS) system built with **Vue 2.7**, **Vuex 3**, **Native SQLite Database**, **Role-Based Access Control (RBAC)**, and **Instant 80mm PDF Receipt Generation**.

---

## ⚡ 1-Click Launch (Windows Shortcut)

You can launch the complete system (SQLite Database Server + POS Frontend + Browser) with a single click:

1. **Double-click [`START-POS.bat`](./START-POS.bat)** in this folder.
   - Automatically detects Node.js.
   - Installs dependencies on the first run (`npm install`).
   - Starts the SQLite database backend on port `3001`.
   - Starts the POS terminal frontend on port `3000`.
   - Opens your browser automatically to `http://localhost:3000`.

2. **Desktop Shortcut**:
   - Double-click [`CREATE-DESKTOP-SHORTCUT.bat`](./CREATE-DESKTOP-SHORTCUT.bat) to create a **"NovaPOS Terminal"** icon directly on your Windows Desktop!

---

## 💻 Manual Installation & Configuration

### Prerequisites
- [Node.js](https://nodejs.org) (v20 or higher recommended, fully compatible with Node 24 native SQLite).

### Setup in 3 Commands:
```bash
# 1. Clone or navigate to the repository
cd pdv-vue2

# 2. Install dependencies
npm install

# 3. Start everything with one command
npm start
```

### Available Scripts
| Command | Description |
| :--- | :--- |
| `npm start` | **Runs both** SQLite Backend (3001) & Vite POS Frontend (3000) concurrently and opens the browser |
| `npm run dev` | Runs the Vite POS Frontend in development mode with HMR |
| `npm run server` | Runs the native Node.js SQLite backend on `http://localhost:3001` |
| `npm run build` | Compiles the production-ready frontend bundle into `dist/` |
| `npm run start:prod` | Serves both the SQLite REST API and production frontend on `http://localhost:3001` |

---

## 👥 Default Operator Credentials

The SQLite database (`server/database.sqlite`) is pre-seeded with clean, generic standard accounts (no personal names):

| Role | Username | 4-Digit PIN | Permissions & Limits |
| :--- | :---: | :---: | :--- |
| **STORE MANAGER** | `admin` | `1234` | Full Administrator: Inventory CRUD [F3], manage employee users, up to 50% discount allowance |
| **CASHIER OPERATOR** | `clerk` | `0000` | Front-line Clerk: Sales & checkout only, no inventory/user changes, capped at 10% discount |

> 💡 **Custom Users & Deletion**: Administrators can register new custom operators and delete any user (including the default `admin`) directly from **[F3] INVENTORY & EMPLOYEES** > **EMPLOYEE USERS & ROLES**. The system automatically unlinks historical sales and removes the user cleanly from the SQLite database.

---

## 🚀 Key System Features

### 1. 👥 Role-Based Access Control (RBAC) & Dynamic Operator Sign-In
- **Minimalist Industrial Sign-In Screen**:
  - Touch/click operator selection buttons (with keyboard shortcuts `[1]` and `[2]`).
  - Blank 4-digit PIN input with `autocomplete="new-password"` to prevent browser credential managers from pre-filling passwords.
  - Virtual numeric keypad `[1-9]`, `[0]`, `[CLR]`, `[←]` plus physical keyboard support.
  - Quick terminal lock button (`LOCK`) on the top header.
- **Enforced Permission Boundaries**:
  - Admin/Manager can access `[F3] Inventory & Employees`, modify stock, add products, and manage staff.
  - Cashier is strictly restricted from inventory and user controls.

### 2. 📄 Instant 80mm PDF Receipt in New Browser Tab
- Finalizing a transaction opens an **80mm thermal receipt PDF in another tab** automatically.
- Top action bar in the receipt tab includes:
  - `PRINT RECEIPT [P]` (direct print dialog)
  - `DOWNLOAD PDF` (saves receipt file)
  - `CLOSE TAB [ESC]`
- Built-in on-screen customer receipt modal also offers `[PDF] OPEN IN TAB` for re-opening anytime.

### 3. 💾 Real SQL Database (Zero-Setup SQLite)
- Runs via Node.js native `node:sqlite` (`DatabaseSync`) inside `server/db.js`.
- Requires zero native compilation tools (`node-gyp` or Python not required).
- Persists all products, sales history, line items, and employee PIN hashes (SHA-256).
- Supports full ACID transactions (`BEGIN TRANSACTION`, `COMMIT`, `ROLLBACK`).

### 4. ⌨️ Retail Keyboard Ergonomics & Web Audio
- High-speed multiplier syntax in barcode search (`3*049000028904` adds 3 Coca-Colas instantly).
- Web Audio API synthesizer for realistic scanner and cash register beeps without external MP3 files.
- Keyboard shortcuts:
  - <kbd>F2</kbd> Product Lookup & Catalog Search
  - <kbd>F3</kbd> Inventory & User Management (Admin Only)
  - <kbd>F4</kbd> Tender / Checkout Modal
  - <kbd>F8</kbd> Void Current Transaction
  - <kbd>F9</kbd> Daily Sales Report & Audit Summary
  - <kbd>ESC</kbd> Close Modals / Cancel
