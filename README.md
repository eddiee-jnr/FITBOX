# 🛒 FitBox — Premium Streetwear E-Commerce Platform

> A full-stack, end-to-end e-commerce web application for FitBox, a Ghana-based premium streetwear brand. Built as a complete E-Business system covering customer-facing shopping, real-time order tracking, and a fully integrated business administration control panel.

🟢 **Live Production Link:** [https://fitbox-production.up.railway.app/](https://fitbox-production.up.railway.app/)

---

## ✨ System Features

### 👤 Customer Portal
- **Dynamic Product Catalog:** Browse and filter the full streetwear collection (Hoodies, Tees, Pants) dynamically loaded from the MySQL database.
- **Cart & Checkout:** Quick-view products, add to cart with size selection, and checkout seamlessly.
- **Mission Control Dashboard:** A personalized user hub to:
  - Track current orders in real time (Pending → Shipped → Delivered)
  - View full order history with product images and prices
  - Manage account details and shipping addresses

### 🛡️ Admin Control Panel
- **Order Management:** Monitor incoming orders and update fulfillment & delivery statuses.
- **Inventory Control:** Monitor stock levels across 'Maestro', 'Legacy', and 'Custom' sections.
- **Customer Relationship Management (CRM):** View customer details, feedback, and securely reply to enquiries directly from the dashboard.
- **Finance & Supply Chain:** Track revenue, manage payments, generate invoices, and handle purchase orders with suppliers.

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, Vanilla CSS, Vanilla JavaScript (DOM manipulation & Fetch API)
- **Backend:** Node.js, Express.js
- **Database:** MySQL (Relational Schema)
- **Deployment & Hosting:** Railway App

---

## 🚀 Local Setup

### 1. Clone the project
```bash
git clone https://github.com/eddiee-jnr/FITBOX.git
cd FITBOX
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Set up the database
Import the schema into a local MySQL instance:
```bash
SOURCE backend/db.sql;
```

Create a `.env` file in the `backend/` folder:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fitbox_db
PORT=3000
```

### 4. Start the backend server
```bash
node server.js
```

### 5. Open the site
Open `index.html` with a live server (e.g. VS Code Live Server on port 5500) or navigate to `http://localhost:3000` (if static serving is configured).
