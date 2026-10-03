import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initDatabase, queryAll, queryOne, execute, hashPin, getDatabasePath, isUsingTurso } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Database Auto-Initialization Middleware
app.use('/api', async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (err) {
    console.error('NovaPOS database initialization failed:', err);
    res.status(500).json({ error: 'Database initialization failed: ' + err.message });
  }
});

// --- AUTH & BADGE LOGIN API ---

// 1. Login with Employee Badge Barcode or Username + PIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, pin } = req.body;
    if (!identifier || !pin) {
      return res.status(400).json({ error: 'Badge code or username and PIN are required.' });
    }

    const cleanId = String(identifier).trim();
    const pinHash = hashPin(pin);

    // Search user in SQL by badge_code OR username
    const formattedBadge = cleanId.startsWith('BADGE-') ? cleanId : `BADGE-${cleanId}`;
    const user = await queryOne(`
      SELECT id, badge_code, username, name, role, max_discount, pin_hash
      FROM users
      WHERE badge_code = ? OR username = ? OR badge_code = ?
    `, [cleanId, cleanId.toLowerCase(), formattedBadge]);

    if (!user) {
      return res.status(401).json({ error: `Badge or user "${cleanId}" not registered in SQL database.` });
    }

    if (user.pin_hash !== pinHash) {
      return res.status(401).json({ error: 'Incorrect 4-digit PIN. Access denied.' });
    }

    // Generate lightweight session token
    const token = `token_${user.id}_${Date.now()}`;
    const { pin_hash, ...safeUser } = user;

    res.json({
      success: true,
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. List all employee badges/users
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await queryAll(`
      SELECT id, badge_code, username, name, role, max_discount, created_at
      FROM users
      ORDER BY id ASC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Register a new user/badge (Admin only)
app.post('/api/auth/users', async (req, res) => {
  try {
    const { badge_code, username, name, pin, role, max_discount } = req.body;
    if (!username || !pin || !name) {
      return res.status(400).json({ error: 'Missing required employee fields.' });
    }

    const finalBadge = badge_code || `BADGE-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalRole = role || 'cashier';
    const finalDiscount = max_discount !== undefined ? max_discount : (finalRole === 'admin' ? 50.0 : 10.0);

    const result = await execute(`
      INSERT INTO users (badge_code, username, name, pin_hash, role, max_discount)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [finalBadge, username.toLowerCase().trim(), name.trim(), hashPin(pin), finalRole, finalDiscount]);

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
      badge_code: finalBadge,
      username,
      name,
      role: finalRole,
      max_discount: finalDiscount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete user (Admin only)
app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const numId = Number(rawId);

    if (!isNaN(numId) && numId > 0) {
      await execute('UPDATE sales SET user_id = NULL WHERE user_id = ?', [numId]);
      await execute('DELETE FROM users WHERE id = ?', [numId]);
    } else {
      const targetUser = await queryOne('SELECT id FROM users WHERE username = ?', [rawId]);
      if (targetUser) {
        await execute('UPDATE sales SET user_id = NULL WHERE user_id = ?', [targetUser.id]);
        await execute('DELETE FROM users WHERE id = ?', [targetUser.id]);
      }
    }

    res.json({ success: true, deletedId: rawId });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- PRODUCTS API (SQL CRUD) ---

// 5. Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await queryAll('SELECT * FROM products ORDER BY name ASC');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Add new product (Admin only)
app.post('/api/products', async (req, res) => {
  try {
    const { barcode, name, price, stock, category, unit } = req.body;
    if (!barcode || !name || price === undefined) {
      return res.status(400).json({ error: 'Missing product data.' });
    }

    const result = await execute(`
      INSERT INTO products (barcode, name, price, stock, category, unit)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      String(barcode).trim(),
      name.trim(),
      Number(price),
      Number(stock) || 0,
      category || 'General',
      unit || 'EA'
    ]);

    const newProduct = await queryOne('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete product (Admin only)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SALES TRANSACTION API ---

// 8. Finalize Sale
app.post('/api/sales', async (req, res) => {
  try {
    const {
      sale_number,
      saleNumber,
      user_id,
      userId,
      operator_name,
      operator,
      subtotal,
      discount_total,
      discountTotal,
      tax_amount,
      taxAmount,
      total_amount,
      totalAmount,
      payment_method,
      paymentMethod,
      received_amount,
      receivedAmount,
      change_amount,
      changeAmount,
      items
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items in sale.' });
    }

    const finalSaleNumber = Number(sale_number || saleNumber || Date.now());
    const finalUserId = user_id || userId || null;
    const finalOperator = operator_name || operator || 'CASHIER';
    const finalSubtotal = Number(subtotal || 0);
    const finalDiscount = Number(discount_total || discountTotal || 0);
    const finalTax = Number(tax_amount || taxAmount || 0);
    const finalTotal = Number(total_amount || totalAmount || 0);
    const finalMethod = payment_method || paymentMethod || 'cash';
    const finalReceived = Number(received_amount !== undefined ? received_amount : (receivedAmount !== undefined ? receivedAmount : finalTotal));
    const finalChange = Number(change_amount !== undefined ? change_amount : (changeAmount !== undefined ? changeAmount : 0));

    const saleResult = await execute(`
      INSERT INTO sales (
        sale_number, user_id, operator_name, subtotal, discount_total,
        tax_amount, total_amount, payment_method, received_amount, change_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      finalSaleNumber,
      finalUserId,
      finalOperator,
      finalSubtotal,
      finalDiscount,
      finalTax,
      finalTotal,
      finalMethod,
      finalReceived,
      finalChange
    ]);

    const saleId = Number(saleResult.lastInsertRowid);

    for (const item of items) {
      const prodId = item.productId || item.product_id || item.id || null;
      await execute(`
        INSERT INTO sale_items (
          sale_id, product_id, name, barcode, qty, unit_price, discount, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId,
        prodId,
        item.name || 'Item',
        item.barcode || '',
        Number(item.qty || 1),
        Number(item.price || item.unit_price || 0),
        Number(item.discount || 0),
        Number(item.total || 0)
      ]);

      if (prodId) {
        await execute('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', [Number(item.qty || 1), prodId]);
      }
    }

    const savedSale = await queryOne('SELECT * FROM sales WHERE id = ?', [saleId]);
    const savedItems = await queryAll('SELECT * FROM sale_items WHERE sale_id = ?', [saleId]);

    res.json({
      success: true,
      sale: {
        ...savedSale,
        items: savedItems
      }
    });
  } catch (err) {
    console.error('Sale transaction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Get Sales History
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await queryAll('SELECT * FROM sales ORDER BY id DESC LIMIT 100');
    const allItems = await queryAll('SELECT * FROM sale_items ORDER BY id ASC');
    const itemsBySale = new Map();
    for (const it of allItems) {
      if (!itemsBySale.has(it.sale_id)) itemsBySale.set(it.sale_id, []);
      itemsBySale.get(it.sale_id).push(it);
    }
    const result = sales.map(s => ({
      ...s,
      items: itemsBySale.get(s.id) || []
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Daily Report & Analytics
const handleReport = async (req, res) => {
  try {
    const summary = await queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders,
        COALESCE(AVG(total_amount), 0) AS avg_ticket
      FROM sales
    `);

    const byTender = await queryAll(`
      SELECT payment_method, COALESCE(SUM(total_amount), 0) AS amount
      FROM sales
      GROUP BY payment_method
    `);

    const recentSales = await queryAll(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) AS item_count
      FROM sales s
      ORDER BY s.id DESC
      LIMIT 50
    `);

    res.json({
      summary,
      byTender,
      recentSales
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/sales/report', handleReport);
app.get('/api/reports/daily', handleReport);

// Serve production frontend assets if built
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

export default app;

const isMainModule = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`⚡ NovaPOS API Server running on http://localhost:${PORT}`);
    console.log(`📂 Database engine: ${isUsingTurso() ? 'Turso libSQL Cloud' : 'Local SQLite (' + getDatabasePath() + ')'}`);
    if (fs.existsSync(distPath)) {
      console.log(`💻 Serving production POS frontend at http://localhost:${PORT}`);
    }
  });
}
