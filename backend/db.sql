-- FitBox E-Business System Database Schema (Refactored: Separate Admins/Customers)
-- Created for Bachelor of ICT - E-Business Course

CREATE DATABASE IF NOT EXISTS fitbox_db;
USE fitbox_db;

-- 1. SEPARATE CUSTOMER AND ADMIN TABLES
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Business Manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Admin (Password: popcorn)
INSERT IGNORE INTO admins (name, email, password, role) VALUES ('Administrator', 'admin@fitbox.com', '$2y$10$Z1eJvXQv8vT4g.8wz9U5e.v3w9w2u8z9u8z9u8z9u8z9u8z9u8z9u', 'Super Admin');

-- 2. CRM MODULE: Communication
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    name VARCHAR(100),
    email VARCHAR(100),
    subject VARCHAR(200),
    message TEXT,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 3. ORDERING SYSTEM: Products and Orders
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    image_url VARCHAR(255),
    section ENUM('maestro', 'legacy', 'custom') DEFAULT 'maestro',
    is_hidden BOOLEAN DEFAULT 0,
    extra_images TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    phone_number VARCHAR(20),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    size VARCHAR(10),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 4. FINANCE MODULE: Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 5. SUPPLY CHAIN MANAGEMENT: Suppliers & Procurements
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    product_type VARCHAR(100),
    type ENUM('supplier', 'partner') DEFAULT 'supplier',
    address TEXT,
    status ENUM('active', 'negotiating', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procurements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    product_id INT,
    product_name VARCHAR(100),
    quantity INT,
    unit_price DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    status ENUM('ordered', 'received') DEFAULT 'ordered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Seed Initial Data
INSERT IGNORE INTO suppliers (company_name, contact_person, email, phone, product_type, type, status) VALUES
('Accra DTF Prints', 'Ama Serwaa', 'printpro@accra.com', '+233555987654', 'DTF Printing', 'partner', 'active'),
('Kantemanto Fabrics', 'Franklin Lee', 'kantemanto.fab@yahoo.com', '+233209716773', 'Heavy Cotton', 'supplier', 'active');

-- FULL PRODUCT CATALOG
INSERT IGNORE INTO products (name, price, category, section, stock_quantity, image_url, is_hidden, extra_images) VALUES
-- MAESTRO
('Demise Grunge Hoodie', 250.00, 'hoodie', 'maestro', 35, 'images/Demise Grunge Oversized Hoodie.jpg', 0, 'images/Demise Hoodie Brown.jpg,images/Demise Hoodie Black.jpg'),
('Man United Home Jersey 1993-1995', 250.00, 'tee', 'maestro', 15, 'images/manu.jpg', 0, NULL),
('Parma White 1999 Away Jersey', 150.00, 'tee', 'maestro', 10, 'images/parma.jpg', 0, NULL),
('FC Barcelona 1996 Home Jersey', 250.00, 'tee', 'maestro', 12, 'images/barca.jpg', 0, NULL),
('Oversized Zip Hoodie Unisex', 180.00, 'hoodie', 'maestro', 45, 'images/Oversized Zip Hoodie Unisex.jpg', 0, 'images/Oversized Zip Hoodie model.jpg,images/Oversized Zip Hoodie colors.jpg'),
('Cropped Football Hoodie/Sweatshirt | Ladies', 120.00, 'hoodie', 'maestro', 20, 'images/Buffalo Football Cropped Hoodie.jpg', 0, 'images/crooped1.jpg,images/crooped2.jpg'),
('Corinthians 1994 All White Jersey', 170.00, 'tee', 'maestro', 8, 'images/corinthians.jpg', 0, NULL),
('Pink & Cream Ibiza City Jersey', 200.00, 'tee', 'maestro', 25, 'images/pinkjersey.jpg', 0, NULL),
('NYC Black Caines Edition Jersey', 170.00, 'tee', 'maestro', 14, 'images/nycblack.jpg', 0, NULL),
('France 1998 World Cup Home Kit', 250.00, 'tee', 'maestro', 10, 'images/france.jpg', 0, NULL),
('Adidas Black & White Long Sleeves', 300.00, 'hoodie', 'maestro', 18, 'images/badidas.jpg', 0, NULL),

-- LEGACY
('NY Brown Boxy Shirt', 170.00, 'tee', 'legacy', 50, 'images/nushirt.jpg', 0, NULL),
('Green & White Varsity', 230.00, 'tee', 'legacy', 15, 'images/jacket.jpg', 0, NULL),
('Cartoons Cream T-Shirt', 120.00, 'tee', 'legacy', 60, 'images/boxytshirt.jpg', 0, NULL),
('Blue and Black Long Sleeve Sweat', 200.00, 'hoodie', 'legacy', 30, 'images/blueandblack.jpg', 0, NULL),
('Murilo Pink Trousers', 250.00, 'pants', 'legacy', 25, 'images/pinkpants2.jpg', 0, NULL),
('Checked Suvage Trousers', 200.00, 'pants', 'legacy', 18, 'images/checkedpants2.jpg', 0, NULL),
('Blacked Nort Sweatshirt', 200.00, 'hoodie', 'legacy', 22, 'images/nort.jpg', 0, NULL),
('Jeans Jorts', 170.00, 'pants', 'legacy', 40, 'images/jorts3.jpg', 0, NULL),
('Blouson Red Jacket', 300.00, 'tee', 'legacy', 12, 'images/redjacket.jpg', 0, NULL),
('Blueline Thin Stripped Trouser', 350.00, 'pants', 'legacy', 10, 'images/blueline2.jpg', 0, NULL),

-- CUSTOM
('Brown Jersey', 170.00, 'tee', 'custom', 15, 'images/brownjersey.jpg', 0, NULL),
('CarlosxPaulo Checked Jeans', 270.00, 'pants', 'custom', 12, 'images/checkedtruser.jpg', 0, NULL),
('Black Denim Jeans', 220.00, 'pants', 'custom', 50, 'images/denimblack.jpg', 0, NULL),
('White & Black Distance Hoodie', 150.00, 'hoodie', 'custom', 30, 'images/distancehoodie.jpg', 0, NULL),
('Demi Green Two Piece Sweat', 200.00, 'hoodie', 'custom', 20, 'images/demitropusers.jpg', 0, NULL),
('Blue Enimi Pants', 200.00, 'pants', 'custom', 25, 'images/enimipants.jpg', 0, NULL),
('AliousCos Cream T-shirt', 120.00, 'tee', 'custom', 60, 'images/creamtee.jpg', 0, NULL),
('White & Green Corveey Sweats', 150.00, 'hoodie', 'custom', 20, 'images/coreevyhoodie.jpg', 0, NULL),
('Black Casino T-shirt', 100.00, 'tee', 'custom', 80, 'images/casinoblack.jpg', 0, NULL),
('All Green Seaszn T-shirt', 120.00, 'tee', 'custom', 40, 'images/greentee.jpg', 0, NULL);
