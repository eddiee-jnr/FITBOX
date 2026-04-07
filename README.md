# FitBox — Premium Streetwear E-Commerce Platform

> A full-stack e-commerce web application for FitBox, a Ghana-based premium streetwear brand. Built as a complete E-Business system covering customer-facing shopping, real-time order tracking, and a fully integrated admin control panel.

---

## ✨ Features

### For Customers
- Browse and filter the full streetwear collection (Hoodies, Tees, Pants)
- Quick-view products and add to cart with size selection
- Checkout with Mobile Money, Card, or Cash on Delivery
- **Mission Control Dashboard** — personal hub to:
  - Track your current order in real time (Confirmed → Shipped → Delivered)
  - View full order history with product images and prices
  - Edit your account details
- User registration and login

### For Admins
- Manage orders and update delivery statuses
- Monitor stock levels and restock products
- View customer enquiries and reply directly — enquiries are auto-marked as **Replied**
- Track sales, payments, and invoices
- Manage suppliers and purchase orders
- Full CRM: customers, feedback, and enquiries

---

## 🚀 Getting Started

### Clone the project
```bash
git clone https://github.com/eddiee-jnr/FITBOX.git
cd FITBOX
```

### Install backend dependencies
```bash
cd backend
npm install
```

### Set up the database
Import the schema into MySQL:
```bash
SOURCE backend/db.sql;
```

Create a `backend/.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fitbox_db
PORT=3000
```

### Start the backend server
```bash
node backend/server.js
```

### Open the site
Open `index.html` with a live server (e.g. VS Code Live Server on port 5500).

---

## 📱 Works on
Mobile · Tablet · Desktop