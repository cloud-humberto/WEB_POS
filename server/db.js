import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

export const db = new DatabaseSync(dbPath);

export function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

export function initDatabase() {
  // 1. Users Table (Badge/Barcode + PIN Hash + RBAC)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge_code TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin' or 'cashier'
      max_discount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL,
      unit TEXT DEFAULT 'EA'
    );
  `);

  // 3. Sales Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_number INTEGER NOT NULL,
      user_id INTEGER,
      operator_name TEXT,
      subtotal REAL NOT NULL,
      discount_total REAL DEFAULT 0,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      received_amount REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 4. Sale Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER,
      name TEXT NOT NULL,
      barcode TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    );
  `);

  // Seed Initial Users (Ensure at least one Admin and Cashier exist)
  const insertUser = db.prepare(`
    INSERT INTO users (badge_code, username, name, pin_hash, role, max_discount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const hasAdmin = db.prepare('SELECT COUNT(*) AS total FROM users WHERE role = ?').get('admin').total;
  if (hasAdmin === 0) {
    insertUser.run('BADGE-9001', 'admin', 'STORE MANAGER', hashPin('1234'), 'admin', 50.0);
    console.log('⚡ Seeded default Admin user: "admin" (PIN: 1234)');
  }

  const hasCashier = db.prepare('SELECT COUNT(*) AS total FROM users WHERE role = ?').get('cashier').total;
  if (hasCashier === 0) {
    insertUser.run('BADGE-1002', 'clerk', 'CASHIER OPERATOR', hashPin('0000'), 'cashier', 10.0);
    console.log('⚡ Seeded default Cashier user: "clerk" (PIN: 0000)');
  }

  // Update existing database rows to ensure standard titles
  db.exec(`
    UPDATE users SET name = 'STORE MANAGER' WHERE username = 'admin';
    UPDATE users SET name = 'CASHIER OPERATOR' WHERE username = 'clerk';
    UPDATE sales SET operator_name = 'CASHIER OPERATOR' WHERE operator_name LIKE '%Alex%';
    UPDATE sales SET operator_name = 'STORE MANAGER' WHERE operator_name LIKE '%Humberto%';
  `);

  // Seed Initial Products (if table is empty)
  const countProducts = db.prepare('SELECT COUNT(*) AS total FROM products').get().total;
  if (countProducts === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (barcode, name, price, stock, category, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const initialCatalog = [
      ['049000028904', 'Coca-Cola Classic 12oz Can', 1.75, 50, 'Beverages', 'EA'],
      ['049000000443', 'Diet Coke 20oz Bottle', 2.25, 40, 'Beverages', 'EA'],
      ['071142000018', 'Spring Water 16.9oz', 1.20, 100, 'Beverages', 'EA'],
      ['611269000010', 'Red Bull Energy Drink 8.4oz', 3.50, 32, 'Beverages', 'EA'],
      ['025000044005', 'Orange Juice 14oz Bottle', 2.80, 25, 'Beverages', 'EA'],
      ['852084004012', 'Cold Brew Coffee 12oz', 3.95, 20, 'Beverages', 'EA'],
      ['200000000001', 'Artisan Baguette', 3.50, 40, 'Bakery', 'EA'],
      ['200000000002', 'Ham & Cheddar Croissant', 5.75, 18, 'Prepared Food', 'EA'],
      ['200000000003', 'Blueberry Muffin', 2.95, 30, 'Bakery', 'EA'],
      ['200000000004', 'Classic Glazed Donut', 1.50, 60, 'Bakery', 'EA'],
      ['200000000005', 'Chicken Club Sandwich', 7.50, 15, 'Prepared Food', 'EA'],
      ['028400000012', 'Potato Chips Sea Salt 5oz', 3.25, 35, 'Snacks', 'EA'],
      ['034000002405', 'Milk Chocolate Bar 3.5oz', 2.10, 65, 'Candy', 'EA'],
      ['030000061203', 'Chewy Granola Bar', 1.15, 80, 'Snacks', 'EA'],
      ['022000004455', 'Peppermint Chewing Gum', 1.45, 90, 'Candy', 'EA'],
      ['041143000023', 'Roasted Almonds 2.5oz', 4.25, 30, 'Snacks', 'EA']
    ];

    for (const item of initialCatalog) {
      insertProduct.run(...item);
    }
  }

  console.log('✅ SQLite database initialized at:', dbPath);
}
