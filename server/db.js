import 'dotenv/config';
import { createClient } from '@libsql/client/web';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localDbPath = path.resolve(__dirname, 'database.sqlite');

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const isTurso = Boolean(databaseUrl);
let tursoClient = null;
let localSqliteDb = null;

export function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
}

export function getDatabasePath() {
  if (isTurso) {
    return databaseUrl;
  }
  return localDbPath;
}

export function isUsingTurso() {
  return isTurso;
}

function getClient() {
  if (isTurso) {
    if (!tursoClient) {
      tursoClient = createClient({ url: databaseUrl, authToken });
    }
    return tursoClient;
  }

  if (process.env.VERCEL) {
    throw new Error('TURSO_DATABASE_URL is required when running serverless on Vercel.');
  }

  if (!localSqliteDb) {
    localSqliteDb = new DatabaseSync(localDbPath);
    localSqliteDb.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA foreign_keys = ON;
    `);
  }
  return localSqliteDb;
}

export async function queryAll(sql, args = []) {
  if (isTurso) {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return result.rows.map((row) =>
      Object.fromEntries(result.columns.map((column, index) => [column, row[index]]))
    );
  } else {
    const db = getClient();
    return db.prepare(sql).all(...args);
  }
}

export async function queryOne(sql, args = []) {
  if (isTurso) {
    const rows = await queryAll(sql, args);
    return rows[0] || null;
  } else {
    const db = getClient();
    return db.prepare(sql).get(...args) || null;
  }
}

export async function execute(sql, args = []) {
  if (isTurso) {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return {
      lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : null,
      rowsAffected: result.rowsAffected
    };
  } else {
    const db = getClient();
    const result = db.prepare(sql).run(...args);
    return {
      lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : null,
      rowsAffected: result.changes
    };
  }
}

let isInitialized = false;
let initPromise = null;

export async function initDatabase() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 1. Users Table (Badge/Barcode + PIN Hash + RBAC)
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge_code TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        max_discount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Products Table
    await execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        category TEXT NOT NULL,
        unit TEXT DEFAULT 'EA'
      )
    `);

    // 3. Sales Table
    await execute(`
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Sale Items Table
    await execute(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        name TEXT NOT NULL,
        barcode TEXT NOT NULL,
        qty INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL
      )
    `);

    // 5. Operating Expenses Table
    await execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        operator TEXT DEFAULT 'STORE MANAGER',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. System Settings Table
    await execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Seed Initial Users (Ensure at least one Admin and Cashier exist)
    const adminRow = await queryOne("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    if (!adminRow || Number(adminRow.total) === 0) {
      await execute(`
        INSERT INTO users (badge_code, username, name, pin_hash, role, max_discount)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['BADGE-9001', 'admin', 'STORE MANAGER', hashPin('1234'), 'admin', 50.0]);
      console.log('⚡ Seeded default Admin user: "admin" (PIN: 1234)');
    }

    const cashierRow = await queryOne("SELECT COUNT(*) AS total FROM users WHERE role = 'cashier'");
    if (!cashierRow || Number(cashierRow.total) === 0) {
      await execute(`
        INSERT INTO users (badge_code, username, name, pin_hash, role, max_discount)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['BADGE-1002', 'clerk', 'CASHIER OPERATOR', hashPin('0000'), 'cashier', 10.0]);
      console.log('⚡ Seeded default Cashier user: "clerk" (PIN: 0000)');
    }

    // Seed Initial Products (if table is empty)
    const prodCountRow = await queryOne('SELECT COUNT(*) AS total FROM products');
    if (!prodCountRow || Number(prodCountRow.total) === 0) {
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
        await execute(`
          INSERT INTO products (barcode, name, price, stock, category, unit)
          VALUES (?, ?, ?, ?, ?, ?)
        `, item);
      }
      console.log('⚡ Seeded 16 initial retail products into catalog');
    }

    isInitialized = true;
    console.log(`✅ NovaPOS database initialized: ${getDatabasePath()}`);
  })();

  return initPromise;
}
