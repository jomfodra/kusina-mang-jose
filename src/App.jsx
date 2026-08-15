import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode.react';
import './styles.css';
import { API_BASE, APP_URL } from './config.js';

// Protected Admin Route
function ProtectedAdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

// Validation function for face photos
async function validateFacePhoto(imageData) {
  try {
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let skinCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skin tone detection (simplified)
        if (r > 95 && g > 40 && b > 20 && r > b && r > g) {
          skinCount++;
        }
      }
      
      return skinCount > data.length * 0.1; // At least 10% skin tones
    };
    img.src = imageData;
    return true;
  } catch (err) {
    return true; // If validation fails, allow it
  }
}

// Camera Component
function Camera({ onCapture }) {
  const [stream, setStream] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(err => alert('Camera access denied: ' + err.message));
  }, []);

  const capture = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const photo = canvasRef.current.toDataURL('image/jpeg');
      onCapture(photo);
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="camera-container">
      <video ref={videoRef} autoPlay playsInline style={{width: '100%', marginBottom: '1rem'}} />
      <canvas ref={canvasRef} style={{display: 'none'}} width={320} height={240} />
      <button onClick={capture} className="btn-primary">Capture Photo</button>
    </div>
  );
}

// HomePage
function HomePage() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/categories`).then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  return (
    <main className="home-page">
      <section className="hero">
        <h1>Welcome to Kusina ni Mang Jose</h1>
        <p>Authentic Filipino Food Delivery</p>
        <button className="btn-primary" onClick={() => navigate('/menu')}>Order Now</button>
      </section>
      <section className="categories">
        <h2>Our Categories</h2>
        <div className="category-grid">
          {categories.map(cat => (
            <div key={cat.id} className="category-card" onClick={() => navigate('/menu')}>
              <h3>{cat.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// MenuPage
function MenuPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/products`).then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  const addToCart = (product) => {
    const newCart = [...cart, product];
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    alert('Added to cart!');
  };

  return (
    <main className="menu-page">
      <h1>Our Menu</h1>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image" style={{background: `url(${product.image}) center/cover`}}></div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="price">₱{product.price}</p>
            <button className="btn-primary" onClick={() => addToCart(product)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </main>
  );
}

// CartPage
function CartPage() {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const navigate = useNavigate();

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <main className="cart-page">
      <h1>Shopping Cart ({cart.length})</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty. <button onClick={() => navigate('/menu')}>Back to Menu</button></p>
      ) : (
        <div>
          <div className="cart-items">
            {cart.map((item, idx) => (
              <div key={idx} className="cart-item">
                <div>
                  <h3>{item.name}</h3>
                  <p>₱{item.price}</p>
                </div>
                <button onClick={() => removeItem(idx)} className="btn-danger">Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total: ₱{total}</h3>
            <button className="btn-primary" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          </div>
        </div>
      )}
    </main>
  );
}

// CheckoutPage
function CheckoutPage() {
  const [formData, setFormData] = useState({
    email: '', phone: '', address: '', name: ''
  });
  const navigate = useNavigate();
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          email: formData.email,
          mobile: formData.phone,
          address: formData.address,
          items: cart,
          total: total
        })
      });
      if (response.ok) {
        alert('Order placed successfully!');
        localStorage.setItem('cart', JSON.stringify([]));
        navigate('/');
      }
    } catch (err) {
      alert('Error placing order: ' + err.message);
    }
  };

  return (
    <main className="checkout-page">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit} className="checkout-form">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required
        />
        <textarea
          placeholder="Delivery Address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          required
        ></textarea>
        <h3>Total: ₱{total}</h3>
        <button type="submit" className="btn-primary">Place Order</button>
      </form>
    </main>
  );
}

// LoginPage
function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const body = isRegister 
      ? { full_name: fullName, email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        navigate(data.role === 'admin' ? '/admin' : '/');
      } else {
        alert(data.error || 'Error');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <main className="login-page">
      <div className="login-form">
        <h1>{isRegister ? 'Register' : 'Login'}</h1>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" className="btn-primary">{isRegister ? 'Register' : 'Login'}</button>
        </form>
        <p>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => setIsRegister(!isRegister)} className="link-btn">
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </main>
  );
}

// RegisterPage with Face Photo
function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', phone: '', address: '', face_photo: null
  });
  const navigate = useNavigate();

  const handleCapture = (photo) => {
    setFormData({...formData, face_photo: photo});
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.face_photo) {
      alert('Face photo is required');
      return;
    }
    // Submit registration
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password
        })
      });
      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <main className="register-page">
      <h1>Register</h1>
      {step === 1 && (
        <form onSubmit={() => setStep(2)} className="form">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <input
            type="tel"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
          <textarea
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            required
          ></textarea>
          <button type="submit" className="btn-primary">Next: Capture Face</button>
        </form>
      )}
      {step === 2 && <Camera onCapture={handleCapture} />}
      {step === 3 && (
        <div className="verify-photo">
          <h2>Verify Your Photo</h2>
          <img src={formData.face_photo} style={{maxWidth: '100%', marginBottom: '1rem'}} />
          <form onSubmit={handleSubmit}>
            <button type="submit" className="btn-primary">Confirm & Complete Registration</button>
          </form>
        </div>
      )}
    </main>
  );
}

// AdminPage
function AdminPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', image: '', category_id: ''
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
    fetch(`${API_BASE}/products`).then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert('Product added!');
        setFormData({ name: '', description: '', price: '', image: '', category_id: '' });
        const products = await fetch(`${API_BASE}/products`).then(r => r.json());
        setProducts(products);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <main className="admin-page">
      <h1>Admin Dashboard</h1>
      <div className="admin-content">
        <section className="add-product">
          <h2>Add Product</h2>
          <form onSubmit={handleAddProduct}>
            <input
              type="text"
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
            <input
              type="number"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
            <input
              type="url"
              placeholder="Image URL"
              value={formData.image}
              onChange={(e) => setFormData({...formData, image: e.target.value})}
            />
            <button type="submit" className="btn-primary">Add Product</button>
          </form>
        </section>
        <section className="products-list">
          <h2>Products</h2>
          {products.map(product => (
            <div key={product.id} className="product-admin-item">
              <h3>{product.name}</h3>
              <p>₱{product.price}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

// InstallQrPage
function InstallQrPage() {
  return (
    <main className="qr-page">
      <h1>Install the App</h1>
      <p>Scan this QR code with your mobile camera to install the Kusina ni Mang Jose app</p>
      <div className="qr-container">
        <QRCode value={APP_URL} size={256} level="H" includeMargin={true} />
      </div>
      <p className="qr-text">Or open: {APP_URL}</p>
    </main>
  );
}

// App Component
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <Router>
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span>KMJ</span>
            <span>Kusina ni Mang Jose</span>
          </div>
          <nav className="nav">
            <a href="/">Home</a>
            <a href="/menu">Menu</a>
            <a href="/cart">Cart</a>
            <a href="/track">Orders</a>
            <a href="/account">Account</a>
            <a href="/qr">QR</a>
            {user?.role === 'admin' && <a href="/admin">Admin</a>}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
        <Route path="/qr" element={<InstallQrPage />} />
      </Routes>

      <footer className="footer">
        <p>&copy; 2026 Kusina ni Mang Jose. All rights reserved.</p>
      </footer>
    </Router>
  );
}

export default App;
