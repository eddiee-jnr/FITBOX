/**
 * shared-admin.js
 * Unified Sidebar and Security Layer for FitBox Mission Control
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Security Check
    const admin = JSON.parse(localStorage.getItem('admin_user'));
    if (!admin || admin.role !== 'admin') {
        window.location.href = "../auth.html";
        return;
    }

    // 2. Inject Sidebar
    injectSidebar();

    // 3. Set Active Link based on current filename
    highlightActiveLink();
});

function injectSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    
    // Get current page to set breadcrumbs
    const path = window.location.pathname;
    const page = path.split("/").pop().replace(".html", "");
    
    sidebar.innerHTML = `
        <div class="logo">FITBOX <span style="font-weight:300; opacity:0.6;">ADMIN</span></div>
        <nav>
            <div class="nav-label">OVERVIEW</div>
            <a href="admin-dashboard.html" id="link-dashboard"><i class="fa-solid fa-gauge-high"></i> Dashboard</a>
            
            <div class="nav-label">CRM</div>
            <a href="crm-customers.html" id="link-customers"><i class="fa-solid fa-user-group"></i> Customers</a>
            <a href="crm-enquiries.html" id="link-enquiries"><i class="fa-solid fa-envelope-open-text"></i> Enquiries</a>
            <a href="crm-feedback.html" id="link-feedback"><i class="fa-solid fa-star"></i> Feedback</a>
            
            <div class="nav-label">FINANCE</div>
            <a href="finance-payments.html" id="link-payments"><i class="fa-solid fa-wallet"></i> Payments Log</a>
            <a href="finance-archive.html" id="link-invoice-archive"><i class="fa-solid fa-receipt"></i> Invoices Archive</a>
            <a href="finance-reports.html" id="link-reports"><i class="fa-solid fa-chart-line"></i> Sales Reports</a>
            
            <div class="nav-label">ORDERS</div>
            <a href="orders-manager.html" id="link-orders"><i class="fa-solid fa-box-archive"></i> Orders</a>
            <a href="orders-inventory.html" id="link-inventory"><i class="fa-solid fa-boxes-stacked"></i> Inventory</a>
            <a href="orders-products.html" id="link-products"><i class="fa-solid fa-tags"></i> Products</a>
            <a href="orders-procurement.html" id="link-procure"><i class="fa-solid fa-file-invoice-dollar"></i> Procurement</a>
            
            <div class="nav-label">SUPPLY CHAIN</div>
            <a href="supply-suppliers.html" id="link-suppliers"><i class="fa-solid fa-truck-field"></i> Suppliers</a>
            <a href="supply-emarket.html" id="link-emarket"><i class="fa-solid fa-globe"></i> E-Market Hub</a>
            <a href="supply-distribution.html" id="link-distribution"><i class="fa-solid fa-route"></i> Distribution</a>
        </nav>
        <div class="sidebar-bottom" style="padding: 15px 30px; border-top: 1px solid rgba(255,255,255,0.05);">
            <style>
                .storefront-btn { display: flex; align-items: center; gap: 8px; text-decoration: none; color: #3c70e9ff; font-size: 12px; margin-bottom: 10px; transition: 0.3s; }
                .storefront-btn:hover { color: #fff; }
                .logout-btn-red { 
                    display: flex; align-items: center; gap: 8px; text-decoration: none; 
                    background: #ee3636ff; color: #fff; padding: 10px 10px; margin-bottom: 10px; border-radius: 6px;
                    font-size: 13px; font-weight: 600; transition: 0.3s; text-align: center; justify-content: center;
                }
                .logout-btn-red:hover { background: #e72828ff; box-shadow: 0 4px 12px rgba(192, 39, 39, 0.51); }
                .sidebar a { padding: 8px 30px !important; }
                .sidebar .nav-label { margin-top: 15px !important; margin-bottom: 5px !important; }
            </style>
            <a href="../index.html" class="storefront-btn"><i class="fa-solid fa-shop"></i> Visit Storefront</a>
            <a href="#" onclick="logout()" class="logout-btn-red"><i class="fa-solid fa-sign-out-alt"></i> Sign Out</a>
        </div>
    `;
    document.body.prepend(sidebar);
}

function highlightActiveLink() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    
    const links = {
        'admin-dashboard.html': 'link-dashboard',
        'crm-customers.html': 'link-customers',
        'crm-enquiries.html': 'link-enquiries',
        'crm-feedback.html': 'link-feedback',
        'finance-reports.html': 'link-reports',
        'finance-payments.html': 'link-payments',
        'orders-manager.html': 'link-orders',
        'orders-inventory.html': 'link-inventory',
        'orders-products.html': 'link-products',
        'supply-suppliers.html': 'link-suppliers',
        'supply-distribution.html': 'link-distribution'
    };

    const activeId = links[page];
    if (activeId) {
        const el = document.getElementById(activeId);
        if (el) el.classList.add('active');
    }
}

function logout() {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_loggedIn');
    window.location.href = "../auth.html";
}

// Global API Helper
const API_URL = "https://fitbox-production.up.railway.app/api";
