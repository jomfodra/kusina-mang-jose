# Kusina ni Mang Jose - Food Ordering App

A modern, responsive food ordering and delivery application for a small-to-medium food business in the Philippines.

## Features

✨ **Customer Features**
- Browse menu by categories
- Add items to cart
- User registration with face photo verification
- Order placement with delivery address
- Order tracking
- PWA (Progressive Web App) for mobile installation

👨‍💼 **Admin Features**
- Admin dashboard for menu management
- Add, edit, and delete products
- View and manage orders
- Manage categories

📱 **Mobile Support**
- Real-time camera access for face photos
- QR code for app installation
- Responsive design for all devices
- PWA offline capability

## Technology Stack

### Frontend
- **React 18** with Vite build tool
- **React Router** for navigation
- **QR Code** generation for PWA install
- Service Worker for offline support
- Mobile-first responsive CSS

### Backend
- **Express.js** Node.js server
- **Supabase** PostgreSQL database (optional)
- **JSON file** persistence for local development
- SHA-256 password hashing
- CORS enabled for cross-origin requests

### Deployment
- **Vercel** for frontend hosting
- **Render** for backend API hosting
- **Supabase** for production database (optional)

## Project Structure

```
kusina-mang-jose/
├── src/
│   ├── App.jsx           # Main React application
│   ├── main.jsx          # React entry point
│   ├── config.js         # Environment configuration
│   └── styles.css        # Global styles
├── server/
│   └── index.js          # Express backend server
├── public/
│   ├── manifest.webmanifest  # PWA configuration
│   └── sw.js             # Service worker
├── index.html            # HTML entry point
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── render.yaml           # Render deployment config
├── vercel.json           # Vercel deployment config
├── .env                  # Environment variables
└── .gitignore            # Git ignore rules
```

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

3. **Build for production**
   ```bash
   npm run build
   ```

## Deployment

### Step 1: Deploy Backend to Render

1. Push code to GitHub
2. Log into [Render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: `kusina-mang-jose-api`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `NODE_ENV=production`
     - `PORT=3001`
     - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
6. Deploy and note the live URL

### Step 2: Deploy Frontend to Vercel

1. Log into [Vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Select GitHub repository
4. Configure:
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     - `VITE_APP_URL=<your-vercel-url>`
     - `VITE_API_URL=<your-render-backend-url>/api`
5. Deploy

### Step 3: Set Up Supabase Database (Optional)

1. Log into [Supabase.com](https://supabase.com)
2. Use SQL Editor to create tables from `supabase-schema.sql`
3. Enable Row Level Security (RLS) policies as needed
4. Update environment variables with Supabase credentials

## Default Admin Account

- **Email**: admin@kusina.ph
- **Password**: admin123

## Environment Variables

```
# Frontend
VITE_APP_URL=https://kusina-mang-jose.vercel.app
VITE_API_URL=https://kusina-mang-jose-api.onrender.com/api

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
NODE_ENV=production
PORT=3001
```

## API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/config` - Business configuration
- `GET /api/categories` - List categories
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/orders` - Place order
- `GET /api/orders/:id` - Get order details

### Admin
- `POST /api/admin/products` - Add product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/orders/:id/status` - Update order status

## Security Features

- SHA-256 password hashing
- Role-based access control (Admin/Customer)
- Face photo verification (heuristic-based)
- CORS protection
- Environment variable isolation

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## PWA Features

- Install as standalone app on mobile
- Offline browsing capability
- Cache-first service worker strategy
- QR code for easy sharing

## Troubleshooting

**CORS Errors**: Ensure backend URL in `.env` is correct and backend is running

**Photo upload fails**: Check camera permissions and browser compatibility

**Supabase connection issues**: Verify credentials and network connectivity

**Database not found**: Run SQL schema setup in Supabase SQL Editor

## License

MIT

## Author

Kusina ni Mang Jose
