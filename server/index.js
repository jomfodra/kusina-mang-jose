import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database file path
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize database
function initializeDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      categories: [],
      products: [],
      users: [],
      customers: [],
      orders: [],
      settings: {
        business_name: "Kusina ni Mang Jose",
        delivery_fee: 50,
        min_order: 100
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
  }
}

// Load/Save database
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    initializeDB();
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Utility functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    if (supabase) {
      const { error } = await supabase.from('categories').select('id').limit(1);
      if (!error) {
        return res.json({ status: 'ok', database: 'supabase' });
      }
    }
    res.json({ status: 'ok', database: 'local' });
  } catch (err) {
    res.json({ status: 'ok', database: 'local', error: err.message });
  }
});

// Get config
app.get('/api/config', (req, res) => {
  const db = loadDB();
  res.json({
    business_name: db.settings?.business_name || "Kusina ni Mang Jose",
    delivery_fee: db.settings?.delivery_fee || 50,
    min_order: db.settings?.min_order || 100
  });
});

// Categories
app.get('/api/categories', (req, res) => {
  const db = loadDB();
  res.json(db.categories || []);
});

app.post('/api/categories', (req, res) => {
  const db = loadDB();
  const category = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.categories = db.categories || [];
  db.categories.push(category);
  saveDB(db);
  res.json(category);
});

// Products
app.get('/api/products', (req, res) => {
  const db = loadDB();
  res.json(db.products || []);
});

app.get('/api/products/:id', (req, res) => {
  const db = loadDB();
  const product = (db.products || []).find(p => p.id === parseInt(req.params.id));
  product ? res.json(product) : res.status(404).json({ error: 'Product not found' });
});

app.post('/api/products', (req, res) => {
  const db = loadDB();
  const product = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.products = db.products || [];
  db.products.push(product);
  saveDB(db);
  res.json(product);
});

app.put('/api/products/:id', (req, res) => {
  const db = loadDB();
  db.products = db.products || [];
  const index = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (index >= 0) {
    db.products[index] = { ...db.products[index], ...req.body, id: parseInt(req.params.id) };
    saveDB(db);
    res.json(db.products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const db = loadDB();
  db.products = db.products || [];
  const index = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (index >= 0) {
    const deleted = db.products.splice(index, 1)[0];
    saveDB(db);
    res.json(deleted);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Admin products
app.post('/api/admin/products', (req, res) => {
  const db = loadDB();
  const product = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  db.products = db.products || [];
  db.products.push(product);
  saveDB(db);
  res.status(201).json(product);
});

app.put('/api/admin/products/:id', (req, res) => {
  const db = loadDB();
  db.products = db.products || [];
  const index = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (index >= 0) {
    db.products[index] = { ...db.products[index], ...req.body };
    saveDB(db);
    res.json(db.products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/admin/products/:id', (req, res) => {
  const db = loadDB();
  db.products = db.products || [];
  const index = db.products.findIndex(p => p.id === parseInt(req.params.id));
  if (index >= 0) {
    db.products.splice(index, 1);
    saveDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Auth
app.post('/api/auth/register', (req, res) => {
  const { full_name, email, password } = req.body;
  const db = loadDB();
  db.users = db.users || [];

  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const user = {
    id: Date.now(),
    full_name,
    email,
    password_hash: hashPassword(password),
    role: 'customer',
    created_at: new Date().toISOString()
  };

  db.users.push(user);
  saveDB(db);
  
  res.status(201).json({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = loadDB();
  db.users = db.users || [];

  const user = db.users.find(u => u.email === email);
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  });
});

// Orders
app.get('/api/orders', (req, res) => {
  const db = loadDB();
  res.json(db.orders || []);
});

app.post('/api/orders', (req, res) => {
  const db = loadDB();
  const order = {
    id: Date.now(),
    order_number: `ORD-${Date.now()}`,
    ...req.body,
    order_status: 'pending',
    created_at: new Date().toISOString()
  };
  db.orders = db.orders || [];
  db.orders.push(order);
  saveDB(db);
  res.status(201).json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const db = loadDB();
  const order = (db.orders || []).find(o => o.id === parseInt(req.params.id) || o.order_number === req.params.id);
  order ? res.json(order) : res.status(404).json({ error: 'Order not found' });
});

app.put('/api/orders/:id/status', (req, res) => {
  const db = loadDB();
  db.orders = db.orders || [];
  const index = db.orders.findIndex(o => o.id === parseInt(req.params.id));
  if (index >= 0) {
    db.orders[index].order_status = req.body.status;
    saveDB(db);
    res.json(db.orders[index]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Start server
initializeDB();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
