const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ── STATIC FILE SERVING ──
app.use(express.static(path.join(__dirname, '..')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ── GLOBAL REQUEST LOGGER (CRITICAL FOR DEBUGGING) ──
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server is up with latest code', time: new Date() });
});

// ── AUTHENTICATION ──
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO customers (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    res.status(201).json({ id: result.insertId, name, email, role: 'customer', message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Check Admins
    let [users] = await db.execute('SELECT *, "admin" as role FROM admins WHERE email = ?', [email]);
    
    // 2. Check Customers if not found in Admins
    if (users.length === 0) {
      [users] = await db.execute('SELECT *, "customer" as role FROM customers WHERE email = ?', [email]);
    }

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── CUSTOMER PROFILE ──
app.get('/api/customers/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, email, phone, address FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch customer profile' }); }
});

app.put('/api/customers/:id', async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    await db.execute('UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?', [name, phone, address, req.params.id]);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to update profile' }); }
});

// ── PRODUCTS & CATALOG ──
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM products WHERE is_hidden = 0');
    res.json(products);
  } catch (error) { res.status(500).json({ error: 'Could not fetch products' }); }
});

app.post('/api/products', async (req, res) => {
  const { name, category, price, stock_quantity, reorder_level, image_url } = req.body;
  try {
    await db.execute(
      'INSERT INTO products (name, category, price, stock_quantity, reorder_level, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category || 'Style', price, stock_quantity, reorder_level || 10, image_url || 'assets/images/default.jpg']
    );
    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update/Delete Product
app.put('/api/products/:id', async (req, res) => {
  const { name, category, price, stock_quantity, reorder_level, image_url } = req.body;
  try {
    await db.execute(
      'UPDATE products SET name=?, category=?, price=?, stock_quantity=?, reorder_level=?, image_url=? WHERE id=?',
      [name, category, price, stock_quantity, reorder_level, image_url, req.params.id]
    );
    res.json({ message: 'Updated successfully' });
  } catch (error) { res.status(500).json({ error: 'Update failed' }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Delete failed' }); }
});

// ── ORDERING SYSTEM ──
app.post('/api/orders', async (req, res) => {
  const { 
    customer_id = null, 
    total_amount = 0, 
    delivery_fee = 0, 
    shipping_address = null, 
    phone_number = null, 
    payment_method = 'card', 
    cart_items = [] 
  } = req.body;

  try {
    const [orderResult] = await db.execute(
      'INSERT INTO orders (customer_id, total_amount, delivery_fee, shipping_address, phone_number, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, total_amount, delivery_fee, shipping_address, phone_number, payment_method]
    );
    const orderId = orderResult.insertId;
    for (const item of cart_items) {
      await db.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time, size) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id || 1, item.qty, item.price, item.size]
      );
      // Decrement stock
      await db.execute(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.qty, item.id || 1]
      );
    }
    await db.execute('INSERT INTO payments (order_id, amount, payment_status) VALUES (?, ?, "pending")', [orderId, total_amount]);
    res.status(201).json({ order_id: orderId, message: 'Order placed successfully' });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ error: 'Order submission failed: ' + error.message });
  }
});

app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, (SELECT GROUP_CONCAT(CONCAT(p.name, ' (', oi.size, ') x', oi.quantity) SEPARATOR ', ') 
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items_summary
      FROM orders o WHERE o.customer_id = ? ORDER BY o.created_at DESC
    `, [req.params.customerId]);
    res.json(orders);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch order history' }); }
});

// ── ADMIN MANAGEMENT API ──
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [[{ total_sales }]] = await db.execute(`
      SELECT SUM(o.total_amount) as total_sales 
      FROM orders o JOIN payments pay ON o.id = pay.order_id 
      WHERE pay.payment_status = 'success' AND o.status != 'cancelled'
    `);
    const [[{ order_count }]] = await db.execute('SELECT COUNT(*) as order_count FROM orders');
    const [[{ customer_count }]] = await db.execute('SELECT COUNT(*) as customer_count FROM customers');
    const [[{ supplier_count }]] = await db.execute('SELECT COUNT(*) as supplier_count FROM suppliers');
    const [recent_orders] = await db.execute(`
      SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 5
    `);
    res.json({ revenue: total_sales || 0, totalOrders: order_count || 0, activeUsers: customer_count || 0, suppliers: supplier_count || 0, recent: recent_orders });
  } catch (error) { res.status(500).json({ error: 'Admin stats failed' }); }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const [catRevenue] = await db.execute(`
      SELECT COALESCE(pr.section, 'General') as category, SUM(oi.quantity * oi.price_at_time) as revenue, SUM(oi.quantity) as units
      FROM order_items oi 
      JOIN products pr ON oi.product_id = pr.id 
      JOIN payments pay ON oi.order_id = pay.order_id
      WHERE pay.payment_status = 'success'
      GROUP BY pr.section
    `);
    const [paymentSplit] = await db.execute(`
      SELECT o.payment_method, SUM(o.total_amount) as total 
      FROM orders o JOIN payments pay ON o.id = pay.order_id
      WHERE pay.payment_status = 'success' AND o.status != "cancelled" 
      GROUP BY o.payment_method
    `);
    const [trends] = await db.execute(`
      SELECT DATE_FORMAT(o.created_at, '%Y-%m-%d') as date, SUM(o.total_amount) as daily_total 
      FROM orders o JOIN payments pay ON o.id = pay.order_id
      WHERE pay.payment_status = 'success' AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      GROUP BY date ORDER BY date ASC
    `);
    res.json({ categories: catRevenue, payments: paymentSplit, trends: trends });
  } catch (error) { res.status(500).json({ error: 'Reports failed' }); }
});

app.get('/api/admin/feedback', async (req, res) => {
  try {
    const [feedback] = await db.execute('SELECT * FROM feedback ORDER BY created_at DESC');
    res.json(feedback);
  } catch (error) { res.status(500).json({ error: 'Feedback failed' }); }
});

app.post('/api/feedback', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    await db.execute('INSERT INTO feedback (name, email, subject, message) VALUES (?, ?, ?, ?)', [name, email, subject, message]);
    res.status(201).json({ message: 'Enquiry received' });
  } catch (error) { res.status(500).json({ error: 'Failed to send enquiry' }); }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, c.name as customer_name, pay.payment_status,
      (SELECT GROUP_CONCAT(CONCAT(p.name, ' (', oi.size, ') x', oi.quantity) SEPARATOR ', ') 
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items_summary
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      LEFT JOIN payments pay ON o.id = pay.order_id 
      ORDER BY o.created_at DESC
    `);
    res.json(orders);
  } catch (error) { res.status(500).json({ error: 'Orders failed' }); }
});

app.put('/api/admin/payments/:orderId/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.execute('UPDATE payments SET payment_status = ? WHERE order_id = ?', [status, req.params.orderId]);
    res.json({ message: 'Payment status updated' });
  } catch (error) { res.status(500).json({ error: 'Payment status update failed' }); }
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (error) { res.status(500).json({ error: 'Status update failed' }); }
});

// Detailed Order for Invoice
app.get('/api/admin/orders/:id', async (req, res) => {
  try {
    const [[order]] = await db.execute(`
      SELECT o.*, c.name as customer_name, c.email as customer_email 
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?
    `, [req.params.id]);
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const [items] = await db.execute(`
      SELECT oi.*, p.name as product_name, p.image_url 
      FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?
    `, [req.params.id]);
    
    order.items = items;
    res.json(order);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch order details' }); }
});

app.get('/api/admin/customers', async (req, res) => {
  try {
    const [customers] = await db.execute(`
      SELECT c.id, c.name, c.email, c.phone, c.created_at, 
      (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) as order_count
      FROM customers c ORDER BY c.created_at DESC
    `);
    res.json(customers);
  } catch (error) { res.status(500).json({ error: 'Customers failed' }); }
});

app.get('/api/admin/customers/summary', async (req, res) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM customers');
    const [[{ active }]] = await db.execute('SELECT COUNT(DISTINCT customer_id) as active FROM orders');
    const [[{ enquiries }]] = await db.execute('SELECT COUNT(*) as enquiries FROM feedback');
    res.json({ total, active, enquiries });
  } catch (error) { res.status(500).json({ error: 'CRM summary failed' }); }
});

app.get('/api/admin/customers/:id/profile', async (req, res) => {
  try {
    const [[customer]] = await db.execute('SELECT id, name, email, phone, address, created_at FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) return res.status(404).json({ error: 'Not found' });
    
    const [[{ totalOrders, totalSpent }]] = await db.execute(
      'SELECT COUNT(*) as totalOrders, SUM(total_amount) as totalSpent FROM orders WHERE customer_id = ?',
      [req.params.id]
    );
    
    const [recentOrders] = await db.execute(
      'SELECT id, total_amount, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 3',
      [req.params.id]
    );
    
    res.json({ 
      ...customer, 
      totalOrders: totalOrders || 0, 
      totalSpent: totalSpent || 0,
      recentOrders 
    });
  } catch (error) { res.status(500).json({ error: 'Profile failed' }); }
});

app.get('/api/admin/inventory/summary', async (req, res) => {
  try {
    const [products] = await db.execute('SELECT stock_quantity, reorder_level FROM products');
    const totals = {
      totalItems: products.length,
      inStock: products.filter(p => Number(p.stock_quantity) > Number(p.reorder_level || 10)).length,
      lowStock: products.filter(p => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= Number(p.reorder_level || 10)).length,
      outStock: products.filter(p => Number(p.stock_quantity) <= 0).length
    };
    res.json(totals);
  } catch (error) { res.status(500).json({ error: 'Summary failed' }); }
});

app.get('/api/admin/distribution/summary', async (req, res) => {
  try {
    const [pipeline] = await db.execute('SELECT status, COUNT(*) as count, SUM(total_amount) as value FROM orders GROUP BY status');
    res.json(pipeline);
  } catch (err) { res.status(500).json({ error: 'Distribution failed' }); }
});

app.get('/api/admin/payments/summary', async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT SUM(o.total_amount) as totalRevenue, AVG(o.total_amount) as avgOrderValue,
      SUM(CASE WHEN LOWER(o.payment_method) = 'momo' THEN o.total_amount ELSE 0 END) as momoRevenue,
      SUM(CASE WHEN LOWER(o.payment_method) = 'card' THEN o.total_amount ELSE 0 END) as cardRevenue
      FROM orders o JOIN payments pay ON o.id = pay.order_id
      WHERE pay.payment_status = 'success' AND o.status != 'cancelled'
    `);
    res.json(stats[0]);
  } catch (err) { res.status(500).json({ error: 'Payment summary failed' }); }
});

app.get('/api/admin/inventory', async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM products ORDER BY section, name');
    res.json(products);
  } catch (error) { res.status(500).json({ error: 'Inventory list failed' }); }
});

app.put('/api/admin/inventory/:id', async (req, res) => {
  const { stock_quantity } = req.body;
  const id = req.params.id;
  console.log(`[RESTOCK] Update received for ID: ${id} | Stock: ${stock_quantity}`);
  try {
    const [result] = await db.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [stock_quantity, id]);
    console.log(`[RESTOCK] Persistence result: ${result.affectedRows} row(s) updated.`);
    res.json({ message: 'Item updated', affected: result.affectedRows });
  } catch (error) { 
    console.error("[RESTOCK ERROR]", error);
    res.status(500).json({ error: 'Item update failed' }); 
  }
});

app.get('/api/admin/suppliers', async (req, res) => {
  try {
    const [suppliers] = await db.execute('SELECT * FROM suppliers ORDER BY type, company_name');
    res.json(suppliers);
  } catch (error) { res.status(500).json({ error: 'Suppliers failed' }); }
});

app.post('/api/admin/suppliers', async (req, res) => {
  const { company_name, contact_person, email, product_type, type } = req.body;
  try {
    await db.execute(
      'INSERT INTO suppliers (company_name, contact_person, email, product_type, type, status) VALUES (?, ?, ?, ?, ?, ?)',
      [company_name, contact_person, email, product_type, type || 'supplier', 'active']
    );
    res.status(201).json({ message: 'Supplier/Partner created' });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Creation failed' }); 
  }
});

app.put('/api/admin/suppliers/:id', async (req, res) => {
  const { contact_person, status, type } = req.body;
  try {
    await db.execute('UPDATE suppliers SET contact_person = ?, status = ?, type = ? WHERE id = ?', [contact_person, status, type, req.params.id]);
    res.json({ message: 'Supplier/Partner updated' });
  } catch (error) { res.status(500).json({ error: 'Supplier update failed' }); }
});

app.get('/api/admin/procurements', async (req, res) => {
  try {
    const [procurements] = await db.execute(`
      SELECT p.*, s.company_name as supplier_name, pr.name as linked_product 
      FROM procurements p 
      JOIN suppliers s ON p.supplier_id = s.id 
      LEFT JOIN products pr ON p.product_id = pr.id
      ORDER BY p.created_at DESC
    `);
    res.json(procurements);
  } catch (error) { res.status(500).json({ error: 'Procurements failed' }); }
});

app.post('/api/admin/procurements', async (req, res) => {
  const { supplier_id, product_id, product_name, quantity, unit_price } = req.body;
  const total_cost = quantity * unit_price;
  try {
    await db.execute(
      'INSERT INTO procurements (supplier_id, product_id, product_name, quantity, unit_price, total_cost) VALUES (?, ?, ?, ?, ?, ?)',
      [supplier_id, product_id, product_name, quantity, unit_price, total_cost]
    );
    res.status(201).json({ message: 'Purchase order created' });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Procurement creation failed' }); 
  }
});

app.put('/api/admin/procurements/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    // Get current status and item details for logic
    const [[procurement]] = await db.execute('SELECT * FROM procurements WHERE id = ?', [req.params.id]);
    if (!procurement) return res.status(404).json({ error: 'Not found' });

    // Transition Logic: If moving to "received" for the first time, update stock
    if (status === 'received' && procurement.status !== 'received' && procurement.product_id) {
      await db.execute(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [procurement.quantity, procurement.product_id]
      );
    }

    await db.execute('UPDATE procurements SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Procurement status updated' });
  } catch (error) { res.status(500).json({ error: 'Update failed' }); }
});

// Final Requirements (Assignment 6.4): E-Market Insights
app.get('/api/admin/emarket/stats', async (req, res) => {
  try {
    // Mock data for conceptual requirement
    res.json({
      activeListings: 124,
      pendingSync: 12,
      lastSync: new Date().toISOString(),
      channels: [
        { name: 'Jumia Ghana', status: 'connected', revenue: 4500, orders: 15 },
        { name: 'Amazon Global', status: 'pending', revenue: 0, orders: 0 },
        { name: 'TikTok Shop', status: 'connected', revenue: 2300, orders: 24 }
      ]
    });
  } catch (error) { res.status(500).json({ error: 'E-market stats failed' }); }
});

// Catch-all 404 for API
app.use('/api', (req, res) => {
  console.log(`[404] API Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `API route ${req.originalUrl} not found` });
});

app.listen(PORT, () => {
  console.log(`FitBox Server is humming on http://localhost:${PORT} 🚀`);
});
